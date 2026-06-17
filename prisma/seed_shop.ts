import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ShopItems...');

  const items: Prisma.ShopItemCreateInput[] = [
    {
      name: 'Golden Frame',
      description: 'A beautiful golden frame for your avatar.',
      category: 'FRAME',
      price: 1500,
      currencyType: 'COINS',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/5484/5484501.png',
      isActive: true,
    },
    {
      name: 'Diamond Frame',
      description: 'A luxurious diamond frame.',
      category: 'FRAME',
      price: 100,
      currencyType: 'GEMS',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/5484/5484504.png',
      isActive: true,
    },
    {
      name: 'Sunset Background',
      description: 'A warm sunset background.',
      category: 'BACKGROUND',
      price: 800,
      currencyType: 'COINS',
      imageUrl: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=200&auto=format&fit=crop',
      isActive: true,
    },
    {
      name: 'Galaxy Background',
      description: 'A stunning view of the galaxy.',
      category: 'BACKGROUND',
      price: 150,
      currencyType: 'GEMS',
      imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=200&auto=format&fit=crop',
      isActive: true,
    },
    {
      name: 'Double XP Boost (15m)',
      description: 'Earn 2x XP for 15 minutes.',
      category: 'BOOST_XP',
      price: 500,
      currencyType: 'COINS',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/476/476834.png',
      isActive: true,
    },
    {
      name: 'Streak Freeze',
      description: 'Protect your streak from breaking for one missed day.',
      category: 'STREAK_FREEZE',
      price: 200,
      currencyType: 'GEMS',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/4481/4481001.png',
      isActive: true,
    },
  ];

  for (const item of items) {
    // @ts-ignore
    await prisma.shopItem.create({
      data: item,
    });
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
