import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async getShopItems() {
    return this.prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { price: 'asc' },
      ],
    });
  }

  async buyItem(userId: string, itemId: string) {
    const item = await this.prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item) throw new BadRequestException('Item not found');
    if (!item.isActive) throw new BadRequestException('Item is no longer available');

    // Chests are not bought directly via this endpoint, they are opened via openChest
    if (item.category === 'CHEST') {
      throw new BadRequestException('Chests must be opened, not bought directly into inventory');
    }

    return this.prisma.$transaction(async (tx) => {
      const userCurrency = await tx.userCurrency.findUnique({ where: { userId } });
      if (!userCurrency) throw new BadRequestException('User currency not found');

      if (item.currencyType === 'GEMS' && userCurrency.gems < item.price) {
        throw new BadRequestException('Not enough gems');
      } else if (item.currencyType === 'COINS' && userCurrency.coins < item.price) {
        throw new BadRequestException('Not enough coins');
      }

      // Deduct currency
      await tx.userCurrency.update({
        where: { userId },
        data: {
          ...(item.currencyType === 'GEMS' ? { gems: { decrement: item.price } } : {}),
          ...(item.currencyType === 'COINS' ? { coins: { decrement: item.price } } : {}),
        },
      });

      // Log transaction
      await tx.currencyTransaction.create({
        data: {
          userId,
          currencyType: item.currencyType,
          amount: -item.price,
          reason: 'SHOP_PURCHASE',
          metadata: { itemId: item.id, itemName: item.name },
        },
      });

      // Add to inventory
      const existingInventory = await tx.userInventory.findUnique({
        where: { userId_itemId: { userId, itemId: item.id } },
      });

      if (existingInventory) {
        // Boosts and Freezes can be stacked. Frames and Backgrounds usually just 1.
        if (item.category === 'FRAME' || item.category === 'BACKGROUND') {
          throw new BadRequestException('You already own this item');
        }
        await tx.userInventory.update({
          where: { id: existingInventory.id },
          data: { quantity: { increment: 1 } },
        });
      } else {
        await tx.userInventory.create({
          data: {
            userId,
            itemId: item.id,
            quantity: 1,
          },
        });
      }

      return { success: true, message: 'Item purchased successfully', item };
    });
  }

  async openChest(userId: string) {
    // Let's say opening a chest costs 50 Gems
    const CHEST_PRICE = 50;
    
    return this.prisma.$transaction(async (tx) => {
      const userCurrency = await tx.userCurrency.findUnique({ where: { userId } });
      if (!userCurrency || userCurrency.gems < CHEST_PRICE) {
        throw new BadRequestException('Not enough gems to open a chest');
      }

      // Deduct 50 Gems
      await tx.userCurrency.update({
        where: { userId },
        data: { gems: { decrement: CHEST_PRICE } },
      });

      await tx.currencyTransaction.create({
        data: {
          userId,
          currencyType: 'GEMS',
          amount: -CHEST_PRICE,
          reason: 'CHEST_OPENED',
          metadata: { action: 'opened_chest' },
        },
      });

      // Random logic for chest reward
      const rand = Math.random();
      let reward: any = null;
      let message = '';

      if (rand < 0.5) { // 50% chance to get 100-200 Coins
        const coinsWon = Math.floor(Math.random() * 101) + 100;
        await tx.userCurrency.update({
          where: { userId },
          data: { coins: { increment: coinsWon } },
        });
        await tx.currencyTransaction.create({
          data: {
            userId,
            currencyType: 'COINS',
            amount: coinsWon,
            reason: 'CHEST_OPENED',
            metadata: { reward: 'coins' },
          },
        });
        reward = { type: 'COINS', amount: coinsWon };
        message = `You got ${coinsWon} Coins!`;
      } else if (rand < 0.8) { // 30% chance for an XP Boost
        // Find an XP boost item
        const boostItem = await tx.shopItem.findFirst({ where: { category: 'BOOST_XP', isActive: true } });
        if (boostItem) {
           await this.giveItemToUser(tx, userId, boostItem.id);
           reward = { type: 'ITEM', item: boostItem };
           message = `You got an ${boostItem.name}!`;
        } else {
           // Fallback to coins if no boost configured
           await tx.userCurrency.update({ where: { userId }, data: { coins: { increment: 200 } } });
           reward = { type: 'COINS', amount: 200 };
           message = `You got 200 Coins!`;
        }
      } else { // 20% chance for a rare frame or background
        const rareItems = await tx.shopItem.findMany({ 
          where: { 
            category: { in: ['FRAME', 'BACKGROUND'] },
            currencyType: 'GEMS', // Assuming GEM items are rare
            isActive: true 
          } 
        });
        if (rareItems.length > 0) {
          const randomItem = rareItems[Math.floor(Math.random() * rareItems.length)];
          // Check if already owns
          const owns = await tx.userInventory.findUnique({ where: { userId_itemId: { userId, itemId: randomItem.id } } });
          if (!owns) {
            await this.giveItemToUser(tx, userId, randomItem.id);
            reward = { type: 'ITEM', item: randomItem };
            message = `Jackpot! You got a rare ${randomItem.category}: ${randomItem.name}!`;
          } else {
             // Already owns, convert to Gems
             await tx.userCurrency.update({ where: { userId }, data: { gems: { increment: 30 } } });
             reward = { type: 'GEMS', amount: 30 };
             message = `You got a duplicate rare item, converted to 30 Gems!`;
          }
        } else {
           await tx.userCurrency.update({ where: { userId }, data: { gems: { increment: 50 } } });
           reward = { type: 'GEMS', amount: 50 };
           message = `You got your 50 Gems back!`;
        }
      }

      return { success: true, message, reward };
    });
  }

  private async giveItemToUser(tx: any, userId: string, itemId: string) {
    const existing = await tx.userInventory.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (existing) {
      await tx.userInventory.update({
        where: { id: existing.id },
        data: { quantity: { increment: 1 } },
      });
    } else {
      await tx.userInventory.create({
        data: { userId, itemId, quantity: 1 },
      });
    }
  }
}
