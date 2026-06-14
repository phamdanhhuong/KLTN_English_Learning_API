import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetFriendsQuestParticipantsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, questKey: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    const userParticipant =
      await this.prisma.friendsQuestParticipant.findUnique({
        where: {
          questKey_userId_weekStartDate: {
            questKey,
            userId,
            weekStartDate: weekStart,
          },
        },
        select: { groupId: true },
      });

    if (!userParticipant) return [];

    return this.prisma.friendsQuestParticipant.findMany({
      where: { groupId: userParticipant.groupId },
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

    // Create a new group for this user's participation
    const group = await this.prisma.friendsQuestGroup.create({
      data: {
        questKey,
        weekStartDate: weekStart,
      },
    });

    const participant = await this.prisma.friendsQuestParticipant.create({
      data: {
        groupId: group.id,
        questKey,
        userId,
        weekStartDate: weekStart,
        isCreator: true,
        joinedAt: now,
        status: 'ACCEPTED' as any,
      },
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
    const inviterParticipation =
      await this.prisma.friendsQuestParticipant.findUnique({
        where: {
          questKey_userId_weekStartDate: {
            questKey,
            userId,
            weekStartDate: weekStart,
          },
        },
      });

    if (!inviterParticipation) {
      throw new BadRequestException(
        'You must join the quest first before inviting',
      );
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
        groupId: inviterParticipation.groupId,
        questKey,
        userId: invitedUserId,
        weekStartDate: weekStart,
        status: 'PENDING' as any,
      },
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
export class AcceptFriendsQuestInviteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, questKey: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    const existing = await this.prisma.friendsQuestParticipant.findUnique({
      where: {
        questKey_userId_weekStartDate: {
          questKey,
          userId,
          weekStartDate: weekStart,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Invitation not found');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Not a pending invitation');
    }

    return this.prisma.friendsQuestParticipant.update({
      where: { id: existing.id },
      data: { status: 'ACCEPTED' as any, joinedAt: now },
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
export class RejectFriendsQuestInviteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, questKey: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    const existing = await this.prisma.friendsQuestParticipant.findUnique({
      where: {
        questKey_userId_weekStartDate: {
          questKey,
          userId,
          weekStartDate: weekStart,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Invitation not found');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Not a pending invitation');
    }

    return this.prisma.friendsQuestParticipant.delete({
      where: { id: existing.id },
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
