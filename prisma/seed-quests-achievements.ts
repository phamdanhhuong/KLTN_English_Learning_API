import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed data cho Quest và Achievement definitions
 * Gọi từ file seed.ts chính
 */
export async function seedQuestsAndAchievements() {
  console.log('🎯 Seeding Quests & Achievements...');

  // ============================================================
  // ACHIEVEMENT DEFINITIONS
  // ============================================================
  
  const achievementDefinitions = [
    // XP Achievements
    {
      key: 'xp_novice',
      name: 'Novice Scholar',
      description: 'Earn 100 XP',
      category: 'xp',
      tier: 1,
      requirement: 100,
      rewardXp: 50,
      rewardGems: 5,
      iconUrl: '/assets/achievements/xp_novice.png',
      badgeUrl: '/assets/badges/xp_novice.png',
    },
    {
      key: 'xp_apprentice',
      name: 'Apprentice Scholar',
      description: 'Earn 500 XP',
      category: 'xp',
      tier: 2,
      requirement: 500,
      rewardXp: 100,
      rewardGems: 10,
      iconUrl: '/assets/achievements/xp_apprentice.png',
      badgeUrl: '/assets/badges/xp_apprentice.png',
    },
    {
      key: 'xp_expert',
      name: 'Expert Scholar',
      description: 'Earn 1,000 XP',
      category: 'xp',
      tier: 3,
      requirement: 1000,
      rewardXp: 200,
      rewardGems: 20,
      iconUrl: '/assets/achievements/xp_expert.png',
      badgeUrl: '/assets/badges/xp_expert.png',
    },
    {
      key: 'xp_master',
      name: 'Master Scholar',
      description: 'Earn 5,000 XP',
      category: 'xp',
      tier: 4,
      requirement: 5000,
      rewardXp: 500,
      rewardGems: 50,
      iconUrl: '/assets/achievements/xp_master.png',
      badgeUrl: '/assets/badges/xp_master.png',
    },
    {
      key: 'xp_legend',
      name: 'Legendary Scholar',
      description: 'Earn 10,000 XP',
      category: 'xp',
      tier: 5,
      requirement: 10000,
      rewardXp: 1000,
      rewardGems: 100,
      iconUrl: '/assets/achievements/xp_legend.png',
      badgeUrl: '/assets/badges/xp_legend.png',
    },

    // Streak Achievements
    {
      key: 'streak_3',
      name: 'Getting Started',
      description: 'Maintain a 3-day streak',
      category: 'streak',
      tier: 1,
      requirement: 3,
      rewardXp: 30,
      rewardGems: 5,
      iconUrl: '/assets/achievements/streak_3.png',
      badgeUrl: '/assets/badges/streak_3.png',
    },
    {
      key: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      category: 'streak',
      tier: 2,
      requirement: 7,
      rewardXp: 70,
      rewardGems: 10,
      iconUrl: '/assets/achievements/streak_7.png',
      badgeUrl: '/assets/badges/streak_7.png',
    },
    {
      key: 'streak_30',
      name: 'Monthly Dedication',
      description: 'Maintain a 30-day streak',
      category: 'streak',
      tier: 3,
      requirement: 30,
      rewardXp: 300,
      rewardGems: 30,
      iconUrl: '/assets/achievements/streak_30.png',
      badgeUrl: '/assets/badges/streak_30.png',
    },
    {
      key: 'streak_100',
      name: 'Centurion',
      description: 'Maintain a 100-day streak',
      category: 'streak',
      tier: 4,
      requirement: 100,
      rewardXp: 1000,
      rewardGems: 100,
      iconUrl: '/assets/achievements/streak_100.png',
      badgeUrl: '/assets/badges/streak_100.png',
    },
    {
      key: 'streak_365',
      name: 'Year of Excellence',
      description: 'Maintain a 365-day streak',
      category: 'streak',
      tier: 5,
      requirement: 365,
      rewardXp: 3650,
      rewardGems: 365,
      iconUrl: '/assets/achievements/streak_365.png',
      badgeUrl: '/assets/badges/streak_365.png',
    },

    // Lesson Achievements
    {
      key: 'lessons_10',
      name: 'Lesson Starter',
      description: 'Complete 10 lessons',
      category: 'lessons',
      tier: 1,
      requirement: 10,
      rewardXp: 50,
      rewardGems: 5,
      iconUrl: '/assets/achievements/lessons_10.png',
      badgeUrl: '/assets/badges/lessons_10.png',
    },
    {
      key: 'lessons_50',
      name: 'Dedicated Learner',
      description: 'Complete 50 lessons',
      category: 'lessons',
      tier: 2,
      requirement: 50,
      rewardXp: 150,
      rewardGems: 15,
      iconUrl: '/assets/achievements/lessons_50.png',
      badgeUrl: '/assets/badges/lessons_50.png',
    },
    {
      key: 'lessons_100',
      name: 'Century of Learning',
      description: 'Complete 100 lessons',
      category: 'lessons',
      tier: 3,
      requirement: 100,
      rewardXp: 300,
      rewardGems: 30,
      iconUrl: '/assets/achievements/lessons_100.png',
      badgeUrl: '/assets/badges/lessons_100.png',
    },
    {
      key: 'lessons_500',
      name: 'Master of Lessons',
      description: 'Complete 500 lessons',
      category: 'lessons',
      tier: 4,
      requirement: 500,
      rewardXp: 1500,
      rewardGems: 150,
      iconUrl: '/assets/achievements/lessons_500.png',
      badgeUrl: '/assets/badges/lessons_500.png',
    },

    // Social Achievements
    {
      key: 'social_follower_5',
      name: 'Social Starter',
      description: 'Follow 5 users',
      category: 'social',
      tier: 1,
      requirement: 5,
      rewardXp: 25,
      rewardGems: 5,
      iconUrl: '/assets/achievements/social_5.png',
      badgeUrl: '/assets/badges/social_5.png',
    },
    {
      key: 'social_follower_20',
      name: 'Community Member',
      description: 'Follow 20 users',
      category: 'social',
      tier: 2,
      requirement: 20,
      rewardXp: 100,
      rewardGems: 10,
      iconUrl: '/assets/achievements/social_20.png',
      badgeUrl: '/assets/badges/social_20.png',
    },
    {
      key: 'social_follower_50',
      name: 'Networking Pro',
      description: 'Follow 50 users',
      category: 'social',
      tier: 3,
      requirement: 50,
      rewardXp: 250,
      rewardGems: 25,
      iconUrl: '/assets/achievements/social_50.png',
      badgeUrl: '/assets/badges/social_50.png',
    },
  ];

  console.log('  📜 Seeding Achievement definitions...');
  for (const ach of achievementDefinitions) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: ach,
      create: ach,
    });
    console.log(`    ✅ Achievement "${ach.name}" (${ach.key})`);
  }

  // ============================================================
  // QUEST DEFINITIONS
  // ============================================================
  
  const questDefinitions = [
    // Daily Quests
    {
      key: 'daily_lesson_3',
      type: 'DAILY' as any,
      category: 'LESSONS' as any,
      name: 'Daily Lessons',
      description: 'Complete 3 lessons today',
      baseRequirement: 3,
      rewardXp: 50,
      rewardGems: 5,
      chestType: 'BRONZE' as any,
      iconUrl: '/assets/quests/daily_lesson.png',
      order: 1,
      isActive: true,
      requiresMultiplayer: false,
    },
    {
      key: 'daily_xp_100',
      type: 'DAILY' as any,
      category: 'XP_EARNED' as any,
      name: 'Daily XP Goal',
      description: 'Earn 100 XP today',
      baseRequirement: 100,
      rewardXp: 30,
      rewardGems: 3,
      chestType: 'BRONZE' as any,
      iconUrl: '/assets/quests/daily_xp.png',
      order: 2,
      isActive: true,
      requiresMultiplayer: false,
    },
    {
      key: 'daily_exercise_5',
      type: 'DAILY' as any,
      category: 'EXERCISES' as any,
      name: 'Practice Makes Perfect',
      description: 'Complete 5 exercises today',
      baseRequirement: 5,
      rewardXp: 40,
      rewardGems: 4,
      chestType: 'BRONZE' as any,
      iconUrl: '/assets/quests/daily_exercise.png',
      order: 3,
      isActive: true,
      requiresMultiplayer: false,
    },

    // Weekly Quests (sử dụng MONTHLY_BADGE cho weekly)
    {
      key: 'weekly_lesson_15',
      type: 'MONTHLY_BADGE' as any,
      category: 'LESSONS' as any,
      name: 'Weekly Learning Goal',
      description: 'Complete 15 lessons this week',
      baseRequirement: 15,
      rewardXp: 200,
      rewardGems: 20,
      chestType: 'SILVER' as any,
      iconUrl: '/assets/quests/weekly_lesson.png',
      order: 1,
      isActive: true,
      requiresMultiplayer: false,
    },
    {
      key: 'weekly_xp_500',
      type: 'MONTHLY_BADGE' as any,
      category: 'XP_EARNED' as any,
      name: 'Weekly XP Challenge',
      description: 'Earn 500 XP this week',
      baseRequirement: 500,
      rewardXp: 150,
      rewardGems: 15,
      chestType: 'SILVER' as any,
      iconUrl: '/assets/quests/weekly_xp.png',
      order: 2,
      isActive: true,
      requiresMultiplayer: false,
    },
    {
      key: 'weekly_streak_7',
      type: 'MONTHLY_BADGE' as any,
      category: 'STREAK' as any,
      name: 'Perfect Week',
      description: 'Maintain a 7-day streak',
      baseRequirement: 7,
      rewardXp: 300,
      rewardGems: 30,
      chestType: 'GOLD' as any,
      iconUrl: '/assets/quests/weekly_streak.png',
      badgeIconUrl: '/assets/badges/perfect_week.png',
      order: 3,
      isActive: true,
      requiresMultiplayer: false,
    },

    // Monthly Quests
    {
      key: 'monthly_lesson_50',
      type: 'MONTHLY_BADGE' as any,
      category: 'LESSONS' as any,
      name: 'Monthly Mastery',
      description: 'Complete 50 lessons this month',
      baseRequirement: 50,
      rewardXp: 500,
      rewardGems: 50,
      chestType: 'GOLD' as any,
      iconUrl: '/assets/quests/monthly_lesson.png',
      order: 1,
      isActive: true,
      requiresMultiplayer: false,
    },
    {
      key: 'monthly_xp_2000',
      type: 'MONTHLY_BADGE' as any,
      category: 'XP_EARNED' as any,
      name: 'Monthly XP Master',
      description: 'Earn 2,000 XP this month',
      baseRequirement: 2000,
      rewardXp: 400,
      rewardGems: 40,
      chestType: 'GOLD' as any,
      iconUrl: '/assets/quests/monthly_xp.png',
      order: 2,
      isActive: true,
      requiresMultiplayer: false,
    },
    {
      key: 'monthly_perfect_attendance',
      type: 'MONTHLY_BADGE' as any,
      category: 'STREAK' as any,
      name: 'Perfect Attendance',
      description: 'Study every day for 30 days',
      baseRequirement: 30,
      rewardXp: 1000,
      rewardGems: 100,
      chestType: 'LEGENDARY' as any,
      iconUrl: '/assets/quests/monthly_attendance.png',
      badgeIconUrl: '/assets/badges/perfect_attendance.png',
      order: 3,
      isActive: true,
      requiresMultiplayer: false,
    },

    // Challenge Quests
    {
      key: 'challenge_speed_10',
      type: 'DAILY' as any,
      category: 'LESSONS' as any,
      name: 'Speed Learner',
      description: 'Complete 10 lessons in 24 hours',
      baseRequirement: 10,
      rewardXp: 300,
      rewardGems: 30,
      chestType: 'GOLD' as any,
      iconUrl: '/assets/quests/challenge_speed.png',
      badgeIconUrl: '/assets/badges/speed_learner.png',
      order: 1,
      isActive: true,
      requiresMultiplayer: false,
    },
    {
      key: 'challenge_perfectionist',
      type: 'DAILY' as any,
      category: 'LESSONS' as any,
      name: 'Perfectionist',
      description: 'Complete 5 lessons with 100% accuracy',
      baseRequirement: 5,
      rewardXp: 250,
      rewardGems: 25,
      chestType: 'GOLD' as any,
      iconUrl: '/assets/quests/challenge_perfect.png',
      badgeIconUrl: '/assets/badges/perfectionist.png',
      order: 2,
      isActive: true,
      requiresMultiplayer: false,
    },

    // Social Quests
    {
      key: 'social_follow_5',
      type: 'FRIENDS' as any,
      category: 'FRIENDS_CHALLENGE' as any,
      name: 'Make Friends',
      description: 'Follow 5 other learners',
      baseRequirement: 5,
      rewardXp: 50,
      rewardGems: 5,
      chestType: 'BRONZE' as any,
      iconUrl: '/assets/quests/social_follow.png',
      order: 1,
      isActive: true,
      requiresMultiplayer: true,
    },
    {
      key: 'social_compete_3',
      type: 'FRIENDS' as any,
      category: 'FRIENDS_CHALLENGE' as any,
      name: 'Friendly Competition',
      description: 'Complete 3 multiplayer challenges',
      baseRequirement: 3,
      rewardXp: 100,
      rewardGems: 10,
      chestType: 'SILVER' as any,
      iconUrl: '/assets/quests/social_compete.png',
      order: 2,
      isActive: true,
      requiresMultiplayer: true,
    },
  ];

  console.log('  🎯 Seeding Quest definitions...');
  for (const quest of questDefinitions) {
    await prisma.quest.upsert({
      where: { key: quest.key },
      update: quest,
      create: quest,
    });
    console.log(`    ✅ Quest "${quest.name}" (${quest.key})`);
  }

  console.log('✅ Quests & Achievements seeding completed!');
}

// Run stand-alone if executed directly
if (require.main === module) {
  seedQuestsAndAchievements()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
