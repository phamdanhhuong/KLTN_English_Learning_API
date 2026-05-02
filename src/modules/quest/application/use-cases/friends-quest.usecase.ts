import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetFriendsQuestParticipantsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(questKey: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    return this.prisma.friendsQuestParticipant.findMany({
      where: { questKey, weekStartDate: weekStart },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: { contribution: 'desc' },
    });
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

@Injectable()
export class JoinFriendsQuestUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, questKey: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    // Check if already joined
    const existing = await this.prisma.friendsQuestParticipant.findUnique({
      where: {
        questKey_userId_weekStartDate: {
          questKey,
          userId,
          weekStartDate: weekStart,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already joined this quest');
    }

    // Check if first to join (becomes creator)
    const participantCount = await this.prisma.friendsQuestParticipant.count({
      where: { questKey, weekStartDate: weekStart },
    });
    const isCreator = participantCount === 0;

    const participant = await this.prisma.friendsQuestParticipant.create({
      data: {
        questKey,
        userId,
        weekStartDate: weekStart,
        isCreator,
        joinedAt: now,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, profilePictureUrl: true },
        },
      },
    });

    return participant;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}


@Injectable()
export class InviteFriendToQuestUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, questKey: string, invitedUserId: string) {
    if (userId === invitedUserId) {
      throw new BadRequestException('Cannot invite yourself');
    }

    const now = new Date();
    const weekStart = this.getWeekStart(now);

    // Check inviter is participant
    const inviterParticipation = await this.prisma.friendsQuestParticipant.findUnique({
      where: {
        questKey_userId_weekStartDate: {
          questKey,
          userId,
          weekStartDate: weekStart,
        },
      },
    });

    if (!inviterParticipation) {
      throw new BadRequestException('You must join the quest first before inviting');
    }

    // Check target not already joined
    const existing = await this.prisma.friendsQuestParticipant.findUnique({
      where: {
        questKey_userId_weekStartDate: {
          questKey,
          userId: invitedUserId,
          weekStartDate: weekStart,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User already in this quest');
    }

    return this.prisma.friendsQuestParticipant.create({
      data: {
        questKey,
        userId: invitedUserId,
        weekStartDate: weekStart,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, profilePictureUrl: true },
        },
      },
    });
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
