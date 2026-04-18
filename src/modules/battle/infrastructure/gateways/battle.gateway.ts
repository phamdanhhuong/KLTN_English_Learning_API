import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject, UseGuards } from '@nestjs/common';
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

  // Map socket.id -> userId
  private socketUserMap = new Map<string, string>();
  // Map userId -> socket.id
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
      if (!token) {
        client.disconnect();
        return;
      }
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
      // onMatchFound
      (matchData) => {
        // Emit to player 1
        this.emitToUser(userId, 'battle:matchFound', matchData);

        // Emit to player 2 (if real player)
        if (!matchData.isBot && matchData.player2) {
          this.emitToUser(matchData.player2.id, 'battle:matchFound', {
            ...matchData,
            // Swap player perspectives
            player1: matchData.player2,
            player2: matchData.player1,
          });
        }
      },
      // onSearching
      (data) => {
        client.emit('battle:searching', data);
      },
    );
  }

  @SubscribeMessage('battle:cancelSearch')
  async handleCancelSearch(@ConnectedSocket() client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;
    await this.matchmakingService.cancelSearch(userId);
    client.emit('battle:searchCancelled', {});
  }

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

      // Notify opponent that this player answered
      const match = await this.battleRepo.findMatchById(data.matchId);
      if (match) {
        const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
        if (opponentId && !match.isBot) {
          this.emitToUser(opponentId, 'battle:opponentAnswered', {
            roundNumber: data.roundNumber,
          });
        }

        // If bot match, trigger bot answer after delay
        if (match.isBot) {
          const botDelay = 3000 + Math.floor(Math.random() * 7000);
          setTimeout(async () => {
            await this.gameService.botAnswer(data.matchId, data.roundNumber);
            await this.sendRoundResult(data.matchId, data.roundNumber, userId);
          }, botDelay);
          return;
        }

        // If both real players answered, send round result
        if (result.bothAnswered) {
          await this.sendRoundResult(data.matchId, data.roundNumber, userId);
        }
      }
    } catch (error: any) {
      client.emit('battle:error', { message: error.message });
    }
  }

  private async sendRoundResult(matchId: string, roundNumber: number, triggerUserId: string) {
    const match = await this.battleRepo.findMatchById(matchId);
    if (!match) return;

    const round = await this.battleRepo.findRound(matchId, roundNumber);
    if (!round) return;

    const correctAnswer = (round.questionData as any).correctAnswer;

    const roundResult = {
      roundNumber,
      player1Points: round.player1Points,
      player2Points: round.player2Points,
      correctAnswer,
      scores: { player1: match.player1Score, player2: match.player2Score },
    };

    // Emit to both players
    this.emitToUser(match.player1Id, 'battle:roundResult', roundResult);
    if (match.player2Id && !match.isBot) {
      this.emitToUser(match.player2Id, 'battle:roundResult', roundResult);
    }

    // Check if match is complete
    if (roundNumber >= match.totalRounds) {
      // Complete match
      setTimeout(async () => {
        const finalResult = await this.gameService.completeMatch(matchId);
        const resultPayload = {
          ...finalResult,
          player1: match.player1,
          player2: match.isBot ? this.gameService.generateBotInfo() : match.player2,
        };

        this.emitToUser(match.player1Id, 'battle:matchResult', resultPayload);
        if (match.player2Id && !match.isBot) {
          this.emitToUser(match.player2Id, 'battle:matchResult', resultPayload);
        }
      }, 2000);
    } else {
      // Send next round after 3 seconds
      const nextRoundNumber = roundNumber + 1;
      const nextRound = match.rounds.find((r: any) => r.roundNumber === nextRoundNumber);

      if (nextRound) {
        setTimeout(() => {
          const question = this.gameService.getRoundQuestion(nextRound);
          this.emitToUser(match.player1Id, 'battle:roundStart', question);
          if (match.player2Id && !match.isBot) {
            this.emitToUser(match.player2Id, 'battle:roundStart', question);
          }
        }, 3000);
      }
    }
  }

  private emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
