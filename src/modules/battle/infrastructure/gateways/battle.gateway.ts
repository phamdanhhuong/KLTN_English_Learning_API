import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BATTLE_TOKENS } from '../../domain/di/tokens';
import type { BattleRepository } from '../../domain/repositories/battle.repository.interface';
import { BattleGameService } from '../../application/services/battle-game.service';
import { BattleMatchmakingService } from '../../application/services/battle-matchmaking.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/battle',
  cors: { origin: '*' },
})
export class BattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(BattleGateway.name);

  private socketUserMap = new Map<string, string>();
  private userSocketMap = new Map<string, string>();

  constructor(
    @Inject(BATTLE_TOKENS.BATTLE_REPOSITORY)
    private readonly battleRepo: BattleRepository,
    private readonly gameService: BattleGameService,
    private readonly matchmakingService: BattleMatchmakingService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;
      this.socketUserMap.set(client.id, userId);
      this.userSocketMap.set(userId, client.id);
      client.join(`user:${userId}`);
      this.logger.log(`Battle connected: ${userId} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.matchmakingService.cancelSearch(userId).catch(() => {});
      this.socketUserMap.delete(client.id);
      this.userSocketMap.delete(userId);
      this.logger.log(`Battle disconnected: ${userId}`);
    }
  }

  @SubscribeMessage('battle:findMatch')
  async handleFindMatch(@ConnectedSocket() client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;

    await this.matchmakingService.findMatch(
      userId,
      (matchData) => {
        this.emitToUser(userId, 'battle:matchFound', matchData);
        if (!matchData.isBot && matchData.player2) {
          this.emitToUser(matchData.player2.id, 'battle:matchFound', {
            ...matchData,
            player1: matchData.player2,
            player2: matchData.player1,
          });
        }
      },
      (data) => { client.emit('battle:searching', data); },
    );
  }

  @SubscribeMessage('battle:cancelSearch')
  async handleCancelSearch(@ConnectedSocket() client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;
    await this.matchmakingService.cancelSearch(userId);
    client.emit('battle:searchCancelled', {});
  }

  // ─── HP Combat: Submit Answer → Instant Damage ───
  @SubscribeMessage('battle:submitAnswer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; roundNumber: number; answer: string; timeMs: number },
  ) {
    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;

    try {
      const result = await this.gameService.submitAnswer(
        data.matchId, userId, data.roundNumber, data.answer, data.timeMs,
      );

      if (result.alreadyAnswered) {
        client.emit('battle:error', { message: 'Already answered' });
        return;
      }

      // ─── EMIT DAMAGE INSTANTLY to both players ───
      const damagePayload = {
        attackerId: result.attackerId,
        targetId: result.targetId,
        damage: result.damage,
        selfDamage: result.selfDamage,
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        roundNumber: result.roundNumber,
        player1Hp: result.player1Hp,
        player2Hp: result.player2Hp,
      };

      const match = await this.battleRepo.findMatchById(data.matchId);
      if (!match) return;

      // Emit damage to both players
      this.emitToUser(match.player1Id, 'battle:damage', damagePayload);
      if (match.player2Id && !match.isBot) {
        this.emitToUser(match.player2Id, 'battle:damage', damagePayload);
      }

      // ─── Check KO ───
      if (result.isKO) {
        await this.handleMatchEnd(data.matchId, true);
        return;
      }

      // ─── Bot match: trigger bot answer after delay ───
      if (match.isBot) {
        const botDelay = 2000 + Math.floor(Math.random() * 5000);
        setTimeout(async () => {
          const botResult = await this.gameService.botAnswer(data.matchId, data.roundNumber);
          if (!botResult) return;

          // Emit bot damage
          const botDamagePayload = {
            attackerId: match.player2Id || 'BOT',
            targetId: match.player1Id,
            damage: botResult.damage,
            selfDamage: botResult.selfDamage,
            isCorrect: botResult.isCorrect,
            correctAnswer: undefined,
            roundNumber: botResult.roundNumber,
            player1Hp: botResult.player1Hp,
            player2Hp: botResult.player2Hp,
          };
          this.emitToUser(match.player1Id, 'battle:damage', botDamagePayload);

          if (botResult.isKO) {
            await this.handleMatchEnd(data.matchId, true);
            return;
          }

          // Both answered → next round
          this.sendNextRound(data.matchId, data.roundNumber);
        }, botDelay);
        return;
      }

      // ─── Real match: check if both answered → next round ───
      if (result.bothAnswered) {
        this.sendNextRound(data.matchId, data.roundNumber);
      }
    } catch (error: any) {
      client.emit('battle:error', { message: error.message });
    }
  }

  // ─── Send next round or end match ───
  private async sendNextRound(matchId: string, currentRound: number) {
    const match = await this.battleRepo.findMatchById(matchId);
    if (!match) return;

    if (currentRound >= match.totalRounds) {
      // All rounds done → end by HP comparison
      await this.handleMatchEnd(matchId, false);
      return;
    }

    const nextRound = match.rounds.find((r: any) => r.roundNumber === currentRound + 1);
    if (!nextRound) return;

    // 2s delay then next question
    setTimeout(() => {
      const question = this.gameService.getRoundQuestion(nextRound);
      this.emitToUser(match.player1Id, 'battle:roundStart', question);
      if (match.player2Id && !match.isBot) {
        this.emitToUser(match.player2Id, 'battle:roundStart', question);
      }
    }, 2000);
  }

  // ─── End match (KO or rounds finished) ───
  private async handleMatchEnd(matchId: string, isKO: boolean) {
    const finalResult = await this.gameService.completeMatch(matchId);
    const match = await this.battleRepo.findMatchById(matchId);

    const resultPayload = {
      ...finalResult,
      isKO,
      player1: match?.player1,
      player2: match?.isBot ? this.gameService.generateBotInfo() : match?.player2,
    };

    if (isKO) {
      // KO → emit immediately
      if (match) {
        this.emitToUser(match.player1Id, 'battle:ko', resultPayload);
        if (match.player2Id && !match.isBot) {
          this.emitToUser(match.player2Id, 'battle:ko', resultPayload);
        }
      }
    } else {
      // Rounds finished → short delay then result
      setTimeout(() => {
        if (match) {
          this.emitToUser(match.player1Id, 'battle:matchResult', resultPayload);
          if (match.player2Id && !match.isBot) {
            this.emitToUser(match.player2Id, 'battle:matchResult', resultPayload);
          }
        }
      }, 1500);
    }
  }

  private emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
