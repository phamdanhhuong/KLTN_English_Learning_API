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

  // Get Skills
  const skill1 = await prisma.skill.findFirst({ where: { title: 'Breakfast Basics' } });
  const skill2 = await prisma.skill.findFirst({ where: { title: 'Lunch & Dinner Vocabulary' } });
  const skill3 = await prisma.skill.findFirst({ where: { title: 'Restaurant English' } });

  if (skill1) {
    await prisma.milestoneSkill.create({
      data: { milestoneId: milestone1.id, skillId: skill1.id }
    });
    console.log(`  🔗 Linked skill '${skill1.title}' to Roadmap 1 - Milestone 1`);
  }

  if (skill2) {
    await prisma.milestoneSkill.create({
      data: { milestoneId: milestone2.id, skillId: skill2.id }
    });
    console.log(`  🔗 Linked skill '${skill2.title}' to Roadmap 1 - Milestone 2`);
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

  const roadmap2Milestone1 = await prisma.milestone.create({
    data: {
      roadmapId: roadmap2.id,
      title: 'Cột mốc 1 - Ngữ pháp nền tảng TOEIC',
      targetLevel: ProficiencyLevel.ELEMENTARY,
      order: 1,
    },
  });

  if (skill3) {
    await prisma.milestoneSkill.create({
      data: { milestoneId: roadmap2Milestone1.id, skillId: skill3.id }
    });
    console.log(`  🔗 Linked skill '${skill3.title}' to Roadmap 2 - Milestone 1`);
  }

  console.log('✅ Roadmaps & Milestones seeding completed!');
}
