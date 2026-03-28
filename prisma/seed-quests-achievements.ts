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
    // ==================== XP Achievements ====================
    // Asset: xp_olympian_doing.png / xp_olympian_done.png
    // Name normalize: "XP Olympian T1" -> xp_olympian (strip _t1)
    {
      key: 'xp_olympian_t1',
      name: 'XP Olympian T1',
      description: 'Tích lũy 500 XP từ các bài học',
      category: 'xp',
      tier: 1,
      requirement: 500,
      rewardXp: 50,
      rewardGems: 5,
    },
    {
      key: 'xp_olympian_t2',
      name: 'XP Olympian T2',
      description: 'Tích lũy 2.000 XP từ các bài học',
      category: 'xp',
      tier: 2,
      requirement: 2000,
      rewardXp: 100,
      rewardGems: 15,
    },
    {
      key: 'xp_olympian_t3',
      name: 'XP Olympian T3',
      description: 'Tích lũy 5.000 XP từ các bài học',
      category: 'xp',
      tier: 3,
      requirement: 5000,
      rewardXp: 250,
      rewardGems: 30,
    },
    {
      key: 'xp_olympian_t4',
      name: 'XP Olympian T4',
      description: 'Tích lũy 15.000 XP từ các bài học',
      category: 'xp',
      tier: 4,
      requirement: 15000,
      rewardXp: 500,
      rewardGems: 50,
    },

    // ==================== Streak Achievements ====================
    // Asset: early_riser_doing.png / early_riser_done.png
    {
      key: 'early_riser_t1',
      name: 'Early Riser T1',
      description: 'Hoàn thành bài học trước 8 giờ sáng 7 ngày',
      category: 'streak',
      tier: 1,
      requirement: 7,
      rewardXp: 50,
      rewardGems: 5,
    },
    {
      key: 'early_riser_t2',
      name: 'Early Riser T2',
      description: 'Hoàn thành bài học trước 8 giờ sáng 30 ngày',
      category: 'streak',
      tier: 2,
      requirement: 30,
      rewardXp: 150,
      rewardGems: 15,
    },

    // Asset: perfect_week_doing.png / perfect_week_done.png
    {
      key: 'perfect_week_t1',
      name: 'Perfect Week T1',
      description: 'Hoàn thành mục tiêu hàng ngày suốt 1 tuần',
      category: 'streak',
      tier: 1,
      requirement: 1,
      rewardXp: 70,
      rewardGems: 10,
    },
    {
      key: 'perfect_week_t2',
      name: 'Perfect Week T2',
      description: 'Đạt 4 tuần hoàn hảo',
      category: 'streak',
      tier: 2,
      requirement: 4,
      rewardXp: 200,
      rewardGems: 25,
    },
    {
      key: 'perfect_week_t3',
      name: 'Perfect Week T3',
      description: 'Đạt 12 tuần hoàn hảo',
      category: 'streak',
      tier: 3,
      requirement: 12,
      rewardXp: 500,
      rewardGems: 50,
    },

    // Asset: sleepwalker_doing.png / sleep_walker_done.png
    {
      key: 'sleepwalker_t1',
      name: 'Sleepwalker T1',
      description: 'Học bài sau 11 giờ đêm 7 lần',
      category: 'streak',
      tier: 1,
      requirement: 7,
      rewardXp: 50,
      rewardGems: 5,
    },

    // ==================== Lessons Achievements ====================
    // Asset: flawless_finisher_doing.png / flawless_finisher_done.png
    {
      key: 'flawless_finisher_t1',
      name: 'Flawless Finisher T1',
      description: 'Hoàn thành 5 bài học với điểm tuyệt đối',
      category: 'lessons',
      tier: 1,
      requirement: 5,
      rewardXp: 50,
      rewardGems: 5,
    },
    {
      key: 'flawless_finisher_t2',
      name: 'Flawless Finisher T2',
      description: 'Hoàn thành 25 bài học với điểm tuyệt đối',
      category: 'lessons',
      tier: 2,
      requirement: 25,
      rewardXp: 150,
      rewardGems: 20,
    },
    {
      key: 'flawless_finisher_t3',
      name: 'Flawless Finisher T3',
      description: 'Hoàn thành 100 bài học với điểm tuyệt đối',
      category: 'lessons',
      tier: 3,
      requirement: 100,
      rewardXp: 400,
      rewardGems: 50,
    },

    // Asset: no_mistake_doing.png / no_mistake_done.png
    {
      key: 'no_mistake_t1',
      name: 'No Mistake T1',
      description: 'Đạt 3 bài tập liên tiếp không sai câu nào',
      category: 'lessons',
      tier: 1,
      requirement: 3,
      rewardXp: 40,
      rewardGems: 5,
    },
    {
      key: 'no_mistake_t2',
      name: 'No Mistake T2',
      description: 'Đạt 10 bài tập liên tiếp không sai câu nào',
      category: 'lessons',
      tier: 2,
      requirement: 10,
      rewardXp: 120,
      rewardGems: 15,
    },

    // Asset: speed_racer_doing.png / speed_racer_done.png
    {
      key: 'speed_racer_t1',
      name: 'Speed Racer T1',
      description: 'Hoàn thành 10 bài tập trong thời gian kỷ lục',
      category: 'lessons',
      tier: 1,
      requirement: 10,
      rewardXp: 60,
      rewardGems: 5,
    },
    {
      key: 'speed_racer_t2',
      name: 'Speed Racer T2',
      description: 'Hoàn thành 50 bài tập trong thời gian kỷ lục',
      category: 'lessons',
      tier: 2,
      requirement: 50,
      rewardXp: 200,
      rewardGems: 25,
    },

    // Asset: mistake_mechanic_doing.png / mistake_mechanic_done.png
    {
      key: 'mistake_mechanic_t1',
      name: 'Mistake Mechanic T1',
      description: 'Sửa đúng 20 câu từ phần ôn tập lỗi sai',
      category: 'lessons',
      tier: 1,
      requirement: 20,
      rewardXp: 50,
      rewardGems: 5,
    },
    {
      key: 'mistake_mechanic_t2',
      name: 'Mistake Mechanic T2',
      description: 'Sửa đúng 100 câu từ phần ôn tập lỗi sai',
      category: 'lessons',
      tier: 2,
      requirement: 100,
      rewardXp: 200,
      rewardGems: 20,
    },

    // Asset: quest_explorer_doing.png / quest_explorer_done.png
    {
      key: 'quest_explorer_t1',
      name: 'Quest Explorer T1',
      description: 'Hoàn thành 5 nhiệm vụ',
      category: 'lessons',
      tier: 1,
      requirement: 5,
      rewardXp: 40,
      rewardGems: 5,
    },
    {
      key: 'quest_explorer_t2',
      name: 'Quest Explorer T2',
      description: 'Hoàn thành 25 nhiệm vụ',
      category: 'lessons',
      tier: 2,
      requirement: 25,
      rewardXp: 150,
      rewardGems: 15,
    },
    {
      key: 'quest_explorer_t3',
      name: 'Quest Explorer T3',
      description: 'Hoàn thành 100 nhiệm vụ',
      category: 'lessons',
      tier: 3,
      requirement: 100,
      rewardXp: 400,
      rewardGems: 40,
    },

    // ==================== Social Achievements ====================
    // Asset: cheerleader_doing.png / cheerleader_done.png
    {
      key: 'cheerleader_t1',
      name: 'Cheerleader T1',
      description: 'Gửi lời động viên cho 10 người bạn',
      category: 'social',
      tier: 1,
      requirement: 10,
      rewardXp: 30,
      rewardGems: 5,
    },
    {
      key: 'cheerleader_t2',
      name: 'Cheerleader T2',
      description: 'Gửi lời động viên cho 50 người bạn',
      category: 'social',
      tier: 2,
      requirement: 50,
      rewardXp: 100,
      rewardGems: 15,
    },

    // Asset: social_butterfly_doing.png
    {
      key: 'social_butterfly_t1',
      name: 'Social Butterfly T1',
      description: 'Kết bạn với 5 người học',
      category: 'social',
      tier: 1,
      requirement: 5,
      rewardXp: 25,
      rewardGems: 5,
    },
    {
      key: 'social_butterfly_t2',
      name: 'Social Butterfly T2',
      description: 'Kết bạn với 20 người học',
      category: 'social',
      tier: 2,
      requirement: 20,
      rewardXp: 100,
      rewardGems: 15,
    },
    {
      key: 'social_butterfly_t3',
      name: 'Social Butterfly T3',
      description: 'Kết bạn với 50 người học',
      category: 'social',
      tier: 3,
      requirement: 50,
      rewardXp: 250,
      rewardGems: 30,
    },

    // ==================== Special / Legend ====================
    // Asset: legend_doing.png / legend_done.png
    {
      key: 'legend_t1',
      name: 'Legend',
      description: 'Đạt cấp bậc Legend trong bảng xếp hạng',
      category: 'competitive',
      tier: 1,
      requirement: 50000,
      rewardXp: 2000,
      rewardGems: 200,
    },
    // Asset: league_mvp_doing.png / league_mvp_done.png
    {
      key: 'league_mvp_t1',
      name: 'League MVP',
      description: 'Kết thúc ở vị trí #1 trong bảng xếp hạng',
      category: 'competitive',
      tier: 1,
      requirement: 1,
      rewardXp: 1000,
      rewardGems: 100,
    },
    // Asset: rarest_diamond_doing.png / rarest_diamond_done.png
    {
      key: 'rarest_diamond_t1',
      name: 'Rarest Diamond',
      description: 'Kết thúc ở vị trí #1 trong giải đấu Kim Cương',
      category: 'competitive',
      tier: 1,
      requirement: 1,
      rewardXp: 5000,
      rewardGems: 500,
    },
    // Asset: year_of_the_dragon_doing.png / year_of_the_dragon_done.png
    {
      key: 'year_of_the_dragon_t1',
      name: 'Year of the Dragon',
      description: 'Hoàn thành 30 bài học trong dịp Tết Nguyên Đán (Sự kiện đặc biệt)',
      category: 'limited',
      tier: 1,
      requirement: 30,
      rewardXp: 888,
      rewardGems: 88,
    },

    // ==================== Personal Records ====================
    // Assets: longest_streak.png, most_xp.png, perfect_lessons.png
    // (these use the record card, not the _doing/_done pattern)
    {
      key: 'longest_streak',
      name: 'Longest Streak',
      description: 'Chuỗi ngày học liên tiếp dài nhất của bạn',
      category: 'personal',
      tier: 1,
      requirement: 7,
      rewardXp: 100,
      rewardGems: 10,
    },
    {
      key: 'most_xp',
      name: 'Most XP',
      description: 'Tổng XP cao nhất đạt được',
      category: 'personal',
      tier: 1,
      requirement: 1000,
      rewardXp: 100,
      rewardGems: 10,
    },
    {
      key: 'perfect_lessons',
      name: 'Perfect Lessons',
      description: 'Số bài học hoàn thành tuyệt đối',
      category: 'personal',
      tier: 1,
      requirement: 10,
      rewardXp: 100,
      rewardGems: 10,
    },
  ];

  console.log('  📜 Seeding Achievement definitions...');
  for (const ach of achievementDefinitions) {
    // Generate badgeUrl from key by stripping tier suffix
    const badgeUrl = ach.key.replace(/_t\d+$/, '');
    const dataToUpsert = { ...ach, badgeUrl };

    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: dataToUpsert,
      create: dataToUpsert,
    });
    console.log(`    ✅ Achievement "${ach.name}" (${ach.key}) -> badgeUrl: ${badgeUrl}`);
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
