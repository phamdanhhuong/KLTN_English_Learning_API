import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Roles
  const roles = [
    { name: 'USER', description: 'Default user role' },
    { name: 'ADMIN', description: 'Administrator role' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`  ✅ Role "${role.name}" seeded`);
  }

  // Seed UserLevels
  console.log('🌱 Seeding UserLevel...');
  await prisma.userLevel.createMany({
    skipDuplicates: true,
    data: [
      { level: 1, minXp: 0, maxXp: 100, title: 'Novice', rewardGems: 0, rewardCoins: 0 },
      { level: 2, minXp: 100, maxXp: 250, title: 'Beginner', rewardGems: 10, rewardCoins: 100 },
      { level: 3, minXp: 250, maxXp: 500, title: 'Explorer', rewardGems: 15, rewardCoins: 150 },
      { level: 4, minXp: 500, maxXp: 850, title: 'Learner', rewardGems: 20, rewardCoins: 200 },
      { level: 5, minXp: 850, maxXp: 1300, title: 'Student', rewardGems: 25, rewardCoins: 250 },
      { level: 6, minXp: 1300, maxXp: 1850, title: 'Scholar', rewardGems: 30, rewardCoins: 300 },
      { level: 7, minXp: 1850, maxXp: 2500, title: 'Linguist', rewardGems: 40, rewardCoins: 400 },
      { level: 8, minXp: 2500, maxXp: 3250, title: 'Communicator', rewardGems: 50, rewardCoins: 500 },
      { level: 9, minXp: 3250, maxXp: 4100, title: 'Fluent', rewardGems: 60, rewardCoins: 600 },
      { level: 10, minXp: 4100, maxXp: 5100, title: 'Advanced', rewardGems: 75, rewardCoins: 750 },
      { level: 11, minXp: 5100, maxXp: 6300, title: 'Expert', rewardGems: 90, rewardCoins: 900 },
      { level: 12, minXp: 6300, maxXp: 7700, title: 'Master', rewardGems: 110, rewardCoins: 1100 },
      { level: 13, minXp: 7700, maxXp: 9300, title: 'Champion', rewardGems: 130, rewardCoins: 1300 },
      { level: 14, minXp: 9300, maxXp: 11100, title: 'Legend', rewardGems: 150, rewardCoins: 1500 },
      { level: 15, minXp: 11100, maxXp: 99999, title: 'Grandmaster', rewardGems: 200, rewardCoins: 2000 },
    ],
  });
  console.log('  ✅ UserLevel seeded (15 levels)');

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

