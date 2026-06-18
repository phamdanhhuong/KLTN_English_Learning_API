import { PrismaClient, LearningGoal, ProficiencyLevel } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRoadmap() {
  console.log('🗺️ Seeding Roadmaps & Milestones...');

  // Clear old data
  await prisma.userRoadmap.deleteMany();
  await prisma.milestoneSkill.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.roadmap.deleteMany();

  // Create Roadmap 1
  const roadmap1 = await prisma.roadmap.create({
    data: {
      title: 'Lộ trình tiếng Anh Giao tiếp cơ bản',
      description: 'Lộ trình dành cho người mất gốc muốn tự tin giao tiếp sau 3 tháng.',
      targetGoal: LearningGoal.CONNECT,
      isActive: true,
    },
  });

  // Create Milestones for Roadmap 1
  const milestone1 = await prisma.milestone.create({
    data: {
      roadmapId: roadmap1.id,
      title: 'Cột mốc 1 - Xây dựng nền tảng (A1)',
      targetLevel: ProficiencyLevel.BEGINNER,
      order: 1,
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      roadmapId: roadmap1.id,
      title: 'Cột mốc 2 - Giao tiếp hàng ngày (A2)',
      targetLevel: ProficiencyLevel.ELEMENTARY,
      order: 2,
    },
  });

  // Link an existing skill to milestone 1 (if available)
  const basicSkill = await prisma.skill.findFirst({
    where: { title: 'Breakfast Basics' }
  });

  if (basicSkill) {
    await prisma.milestoneSkill.create({
      data: {
        milestoneId: milestone1.id,
        skillId: basicSkill.id,
      }
    });
    console.log(`  🔗 Linked skill '${basicSkill.title}' to Milestone 1`);
  }

  // Create Roadmap 2
  const roadmap2 = await prisma.roadmap.create({
    data: {
      title: 'Lộ trình Luyện thi TOEIC 600+',
      description: 'Dành cho sinh viên và người đi làm cần chứng chỉ TOEIC.',
      targetGoal: LearningGoal.CAREER,
      isActive: true,
    },
  });

  await prisma.milestone.create({
    data: {
      roadmapId: roadmap2.id,
      title: 'Cột mốc 1 - Ngữ pháp nền tảng TOEIC',
      targetLevel: ProficiencyLevel.ELEMENTARY,
      order: 1,
    },
  });

  console.log('✅ Roadmaps & Milestones seeding completed!');
}
