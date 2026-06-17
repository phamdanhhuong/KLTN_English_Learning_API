import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(userId: string) {
    return this.prisma.userInventory.findMany({
      where: { userId },
      include: {
        item: true,
      },
      orderBy: { acquiredAt: 'desc' },
    });
  }

  async getEquippedItem(userId: string) {
    let equipped = await this.prisma.userEquippedItem.findUnique({
      where: { userId },
    });
    
    if (!equipped) {
      equipped = await this.prisma.userEquippedItem.create({
        data: { userId },
      });
    }
    
    // Fetch actual item details if needed, or just return IDs
    return equipped;
  }

  async equipItem(userId: string, itemId: string) {
    const inventoryItem = await this.prisma.userInventory.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });

    if (!inventoryItem || inventoryItem.quantity < 1) {
      throw new BadRequestException('You do not own this item');
    }

    const category = inventoryItem.item.category;
    if (category !== 'FRAME' && category !== 'BACKGROUND') {
      throw new BadRequestException('You can only equip Frames and Backgrounds');
    }

    return this.prisma.$transaction(async (tx) => {
      let equipped = await tx.userEquippedItem.findUnique({ where: { userId } });
      if (!equipped) {
        equipped = await tx.userEquippedItem.create({ data: { userId } });
      }

      const updateData: any = {};
      if (category === 'FRAME') {
        updateData.frameId = itemId;
      } else if (category === 'BACKGROUND') {
        updateData.backgroundId = itemId;
      }

      await tx.userEquippedItem.update({
        where: { userId },
        data: updateData,
      });

      return { success: true, message: `Equipped ${category.toLowerCase()}` };
    });
  }

  async useItem(userId: string, itemId: string) {
    const inventoryItem = await this.prisma.userInventory.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });

    if (!inventoryItem || inventoryItem.quantity < 1) {
      throw new BadRequestException('You do not own this item');
    }

    const category = inventoryItem.item.category;
    if (category !== 'BOOST_XP' && category !== 'STREAK_FREEZE') {
      throw new BadRequestException('This item cannot be used directly');
    }

    return this.prisma.$transaction(async (tx) => {
      // Consume 1 item
      if (inventoryItem.quantity === 1) {
        await tx.userInventory.delete({
          where: { id: inventoryItem.id },
        });
      } else {
        await tx.userInventory.update({
          where: { id: inventoryItem.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      // TODO: Implement actual boost/freeze logic here based on item category
      // e.g. Add 15 mins XP boost to user session or increment freeze count in StreakData
      if (category === 'STREAK_FREEZE') {
        const streakData = await tx.streakData.findUnique({ where: { userId } });
        if (streakData) {
          await tx.streakData.update({
            where: { userId },
            data: { freezeCount: { increment: 1 } },
          });
        }
      } else if (category === 'BOOST_XP') {
         // Logic for XP Boost - could store a temporary flag or expiration in Redis/DB
      }

      return { success: true, message: `Used ${inventoryItem.item.name}` };
    });
  }
}
