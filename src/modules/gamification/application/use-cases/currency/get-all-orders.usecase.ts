import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface GetAllOrdersQuery {
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetAllOrdersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAllOrdersQuery) {
    const { status, userId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }
    if (userId) {
      where.userId = userId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentOrder.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
