import { PrismaClient, ExerciseType, Word, Grammar } from '@prisma/client';
import { seedQuestsAndAchievements } from './seed-quests-achievements';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================
  // 1. AUTH MODULE — Seed Roles
  // ============================================================
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

  // ============================================================
  // 2. SKILL / LEARNING MODULE — Seed Learning Data
  // ============================================================

  // Clear existing learning data (order matters for FK constraints)
  await prisma.skillProgress.deleteMany();
  await prisma.wordMastery.deleteMany();
  await prisma.grammarMastery.deleteMany();
  await prisma.exerciseWord.deleteMany();
  await prisma.exerciseGrammar.deleteMany();
  await prisma.skillWord.deleteMany();
  await prisma.skillGrammar.deleteMany();
  await prisma.wordTag.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.skillLevel.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillPart.deleteMany();
  await prisma.word.deleteMany();
  await prisma.grammar.deleteMany();
  await prisma.tag.deleteMany();

  // Create sample tags
  const basicTag = await prisma.tag.create({
    data: {
      name: 'basic',
    },
  });

  const commonTag = await prisma.tag.create({
    data: {
      name: 'common',
    },
  });

  // Create Skill Parts
  const part1 = await prisma.skillPart.create({
    data: {
      name: 'Basic English Fundamentals',
      description:
        'Essential vocabulary and basic grammar for everyday English communication',
      position: 1,
    },
  });

  const part2 = await prisma.skillPart.create({
    data: {
      name: 'Intermediate Communication',
      description:
        'Advanced vocabulary and complex grammar structures for fluent communication',
      position: 2,
    },
  });

  console.log(`✅ Created skill parts: ${part1.name}, ${part2.name}`);

  // Create sample words from the Oxford 3000 list
  const sampleWords = [
    {
      content: 'Breakfast',
      pronunciation: 'ˈbrekfəst',
      meaning: 'Bữa ăn sáng',
      audioUrl: 'example',
    },
    {
      content: 'Cereal',
      pronunciation: 'ˈsɪərɪəl',
      meaning: 'Ngũ cốc',
      audioUrl: 'example',
    },
    {
      content: 'Pancake',
      pronunciation: 'ˈpænkeɪk',
      meaning: 'Bánh kếp',
      audioUrl: 'example',
    },
    {
      content: 'Waffle',
      pronunciation: 'ˈwɒfl',
      meaning: 'Bánh quế',
      audioUrl: 'example',
    },
    {
      content: 'Toast',
      pronunciation: 'təʊst',
      meaning: 'Bánh mì nướng',
      audioUrl: 'example',
    },
    {
      content: 'Egg',
      pronunciation: 'eɡ',
      meaning: 'Trứng',
      audioUrl: 'example',
    },
    {
      content: 'Bacon',
      pronunciation: 'ˈbeɪkən',
      meaning: 'Thịt xông khói',
      audioUrl: 'example',
    },
    {
      content: 'Sausage',
      pronunciation: 'ˈsɒsɪdʒ',
      meaning: 'Xúc xích',
      audioUrl: 'example',
    },
    {
      content: 'Yogurt',
      pronunciation: 'ˈjɒɡət',
      meaning: 'Sữa chua',
      audioUrl: 'example',
    },
    {
      content: 'Fruit',
      pronunciation: 'fruːt',
      meaning: 'Trái cây',
      audioUrl: 'example',
    },
    {
      content: 'Muffin',
      pronunciation: 'ˈmʌfɪn',
      meaning: 'Bánh nướng xốp',
      audioUrl: 'example',
    },
    {
      content: 'Coffee',
      pronunciation: 'ˈkɒfi',
      meaning: 'Cà phê',
      audioUrl: 'example',
    },
    {
      content: 'Juice',
      pronunciation: 'dʒuːs',
      meaning: 'Nước ép',
      audioUrl: 'example',
    },
    {
      content: 'Syrup',
      pronunciation: 'ˈsɪrəp',
      meaning: 'Xi-rô',
      audioUrl: 'example',
    },
    {
      content: 'Jam',
      pronunciation: 'dʒæm',
      meaning: 'Mứt',
      audioUrl: 'example',
    },
    {
      content: 'Cook',
      pronunciation: 'kʊk',
      meaning: 'Nấu ăn (Động từ)',
      audioUrl: 'example',
    },
    {
      content: 'Eat',
      pronunciation: 'iːt',
      meaning: 'Ăn (Động từ)',
      audioUrl: 'example',
    },
    {
      content: 'Drink',
      pronunciation: 'drɪŋk',
      meaning: 'Uống (Động từ)',
      audioUrl: 'example',
    },
    {
      content: 'Fry',
      pronunciation: 'fraɪ',
      meaning: 'Chiên/Rán (Động từ)',
      audioUrl: 'example',
    },
    {
      content: 'Boil',
      pronunciation: 'bɔɪl',
      meaning: 'Luộc (Động từ)',
      audioUrl: 'example',
    },
    {
      content: 'Hungry',
      pronunciation: 'ˈhʌŋɡri',
      meaning: 'Đói (Tính từ)',
      audioUrl: 'example',
    },
    {
      content: 'Delicious',
      pronunciation: 'dɪˈlɪʃəs',
      meaning: 'Ngon (Tính từ)',
      audioUrl: 'example',
    },
    {
      content: 'Healthy',
      pronunciation: 'ˈhelθi',
      meaning: 'Lành mạnh (Tính từ)',
      audioUrl: 'example',
    },
    {
      content: 'Quick',
      pronunciation: 'kwɪk',
      meaning: 'Nhanh chóng (Tính từ)',
      audioUrl: 'example',
    },
    {
      content: 'Fresh',
      pronunciation: 'freʃ',
      meaning: 'Tươi (mới) (Tính từ)',
      audioUrl: 'example',
    },
  ];

  const createdWords: Word[] = [];
  for (const wordData of sampleWords) {
    const word = await prisma.word.create({
      data: wordData,
    });

    await prisma.wordTag.create({
      data: {
        wordId: word.id,
        tagId: commonTag.id,
      },
    });

    createdWords.push(word);
  }

  console.log(`✅ Created ${createdWords.length} words`);

  // Create sample grammar rules
  const grammarRules = [
    {
      rule: 'Present Simple',
      explanation:
        'Dùng để diễn tả thói quen, sự thật hiển nhiên, lịch trình cố định',
      examples: [
        'I work every day.',
        'She studies English.',
        'The sun rises in the east.',
        'The train leaves at 9 AM.',
      ],
    },
    {
      rule: 'Present Continuous',
      explanation: 'Dùng để diễn tả hành động đang diễn ra tại thời điểm nói',
      examples: [
        'I am working now.',
        'She is studying English.',
        'They are playing football.',
        'We are having dinner.',
      ],
    },
  ];

  const createdGrammars: Grammar[] = [];
  for (const grammarData of grammarRules) {
    const grammar = await prisma.grammar.create({
      data: {
        rule: grammarData.rule,
        explanation: grammarData.explanation,
        examples: grammarData.examples,
      },
    });
    createdGrammars.push(grammar);
  }

  console.log(`✅ Created ${createdGrammars.length} grammar rules`);

  // Create the main skill (assign to part1)
  const skill1 = await prisma.skill.create({
    data: {
      title: 'Breakfast Basics',
      description:
        'Learn essential vocabulary and grammar related to breakfast foods and routines.',
      position: 1,
      partId: part1.id,
    },
  });

  console.log(`✅ Created skill: ${skill1.title}`);

  // Create empty skills for part2
  const skill2 = await prisma.skill.create({
    data: {
      title: 'Lunch & Dinner Vocabulary',
      description: 'Advanced vocabulary for lunch and dinner conversations.',
      position: 2,
      partId: part2.id,
    },
  });

  const skill3 = await prisma.skill.create({
    data: {
      title: 'Restaurant English',
      description: 'Essential phrases and vocabulary for dining out.',
      position: 3,
      partId: part2.id,
    },
  });

  console.log(
    `✅ Created empty skills in part2: ${skill2.title}, ${skill3.title}`,
  );

  // Create skill-word associations (first 10 words for skill1)
  for (let i = 0; i < createdWords.length; i++) {
    await prisma.skillWord.create({
      data: {
        skillId: skill1.id,
        wordId: createdWords[i].id,
      },
    });
  }

  // Create skill-grammar associations
  for (const grammar of createdGrammars) {
    await prisma.skillGrammar.create({
      data: {
        skillId: skill1.id,
        grammarId: grammar.id,
      },
    });
  }

  // Create 7 skill levels for skill1
  for (let level = 1; level <= 7; level++) {
    await prisma.skillLevel.create({
      data: {
        skillId: skill1.id,
        level,
      },
    });
  }

  console.log('✅ Created 7 skill levels');

  // Level 1: New word learning - listening exercises with multiple choice
  const level1Lessons = [
    { title: 'Basic Vocabulary Set 1', words: createdWords.slice(0, 5) },
    { title: 'Basic Vocabulary Set 2', words: createdWords.slice(5, 10) },
    { title: 'Basic Vocabulary Set 3', words: createdWords.slice(10, 15) },
    { title: 'Basic Vocabulary Set 4', words: createdWords.slice(15, 20) },
    { title: 'Basic Vocabulary Set 5', words: createdWords.slice(20, 25) },
  ];

  // Define exercise data for each lesson
  const exerciseDataLesson1 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Breakfast', right: 'Bữa ăn sáng' },
          { left: 'Cereal', right: 'Ngũ cốc' },
          { left: 'Pancake', right: 'Bánh kếp' },
          { left: 'Waffle', right: 'Bánh quế' },
          { left: 'Toast', right: 'Bánh mì nướng' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Toast" có nghĩa là gì?',
      meta: {
        question: 'Toast có nghĩa là gì?',
        options: [
          { text: 'Bánh kếp', order: -1 },
          { text: 'Bánh quế', order: -1 },
          { text: 'Bánh mì nướng', order: 1 },
          { text: 'Ngũ cốc', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Pancake',
        options: ['Waffle', 'Pancake', 'Toast', 'Cereal'],
        sentence: 'Pancake',
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Bánh quế"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Bánh quế"?',
        options: [
          { text: 'Breakfast', order: -1 },
          { text: 'Toast', order: -1 },
          { text: 'Waffle', order: 1 },
          { text: 'Cereal', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Ngũ cốc"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Ngũ cốc"?',
        options: [
          { text: 'Breakfast', order: -1 },
          { text: 'Cereal', order: 1 },
          { text: 'Pancake', order: -1 },
          { text: 'Toast', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Breakfast" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Breakfast" (ˈbrekfəst) - Bữa ăn sáng',
        expectedText: 'Breakfast',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Waffle" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Waffle" (ˈwɒfl) - Bánh quế',
        expectedText: 'Waffle',
      },
    },
  ];
  const exerciseDataLesson2 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Egg', right: 'Trứng' },
          { left: 'Bacon', right: 'Thịt xông khói' },
          { left: 'Sausage', right: 'Xúc xích' },
          { left: 'Yogurt', right: 'Sữa chua' },
          { left: 'Fruit', right: 'Trái cây' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Thịt xông khói"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Thịt xông khói"?',
        options: [
          { text: 'Egg', order: -1 },
          { text: 'Fruit', order: -1 },
          { text: 'Bacon', order: 1 },
          { text: 'Sausage', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Yogurt" có nghĩa là gì?',
      meta: {
        question: '"Yogurt" có nghĩa là gì?',
        options: [
          { text: 'Trái cây', order: -1 },
          { text: 'Trứng', order: -1 },
          { text: 'Xúc xích', order: -1 },
          { text: 'Sữa chua', order: 1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Trái cây"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Trái cây"?',
        options: [
          { text: 'Sausage', order: -1 },
          { text: 'Bacon', order: -1 },
          { text: 'Yogurt', order: -1 },
          { text: 'Fruit', order: 1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt:
        'Hoàn thành các câu sau: "I ordered a breakfast plate with an __." và "She likes __." (Tôi gọi một đĩa ăn sáng với một quả trứng. Cô ấy thích xúc xích.)',
      meta: {
        sentences: [
          {
            text: 'I ordered a breakfast plate with an ___.',
            correctAnswer: 'egg',
            options: ['egg', 'sausage', 'bacon', 'yogurt'],
          },
          {
            text: 'She likes ___.',
            correctAnswer: 'sausage',
            options: ['egg', 'sausage', 'bacon', 'yogurt'],
          },
        ],
        context: 'Điền từ vựng liên quan đến món mặn trong bữa sáng.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Bacon" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Bacon" (ˈbeɪkən) - Thịt xông khói',
        expectedText: 'Bacon',
      },
    },
  ];
  const exerciseDataLesson3 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Muffin', right: 'Bánh nướng xốp' },
          { left: 'Coffee', right: 'Cà phê' },
          { left: 'Juice', right: 'Nước ép' },
          { left: 'Syrup', right: 'Xi-rô' },
          { left: 'Jam', right: 'Mứt' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Syrup" có nghĩa là gì?',
      meta: {
        question: '"Syrup" có nghĩa là gì?',
        options: [
          { text: 'Nước ép', order: -1 },
          { text: 'Cà phê', order: -1 },
          { text: 'Mứt', order: -1 },
          { text: 'Xi-rô', order: 1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Bánh nướng xốp"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Bánh nướng xốp"?',
        options: [
          { text: 'Muffin', order: 1 },
          { text: 'Waffle', order: -1 },
          { text: 'Toast', order: -1 },
          { text: 'Pancake', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt:
        'Hoàn thành câu sau: "I need a strong __ in the morning. She prefers orange __." (Tôi cần một ly cà phê đậm vào buổi sáng. Cô ấy thích nước ép cam hơn.)',
      meta: {
        sentences: [
          {
            text: 'I need a strong ___ in the morning.',
            correctAnswer: 'coffee',
            options: ['coffee', 'juice', 'syrup', 'jam'],
          },
          {
            text: 'She prefers orange ___ .',
            correctAnswer: 'juice',
            options: ['coffee', 'juice', 'syrup', 'jam'],
          },
        ],
        context:
          'Điền hai loại đồ uống phổ biến cho bữa sáng (cà phê và nước ép).',
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Mứt"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Mứt"?',
        options: [
          { text: 'Juice', order: -1 },
          { text: 'Syrup', order: -1 },
          { text: 'Jam', order: 1 },
          { text: 'Muffin', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Coffee" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Coffee" (ˈkɒfi) - Cà phê',
        expectedText: 'Coffee',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Muffin" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Muffin" (ˈmʌfɪn) - Bánh nướng xốp',
        expectedText: 'Muffin',
      },
    },
  ];
  const exerciseDataLesson4 = [
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Động từ nào có nghĩa là "Chiên/Rán"?',
      meta: {
        question: 'Động từ nào có nghĩa là "Chiên/Rán"?',
        options: [
          { text: 'Cook', order: -1 },
          { text: 'Boil', order: -1 },
          { text: 'Fry', order: 1 },
          { text: 'Eat', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt:
        'Hoàn thành câu: "My dad always __ eggs on Sunday morning." (Bố tôi luôn nấu trứng vào sáng Chủ nhật.)',
      meta: {
        sentences: [
          {
            text: 'My dad always ___ eggs on Sunday morning.',
            correctAnswer: 'cooks',
            options: ['cooks', 'fries', 'boils', 'eats'],
          },
        ],
        context: 'Động từ chỉ hành động chế biến thức ăn (lưu ý chia động từ).',
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Động từ nào có nghĩa là "Luộc"?',
      meta: {
        question: 'Động từ nào có nghĩa là "Luộc"?',
        options: [
          { text: 'Drink', order: -1 },
          { text: 'Eat', order: -1 },
          { text: 'Boil', order: 1 },
          { text: 'Fry', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt:
        'Hoàn thành câu: "I like to __ cereal and __ milk for breakfast." (Tôi thích ăn ngũ cốc và uống sữa vào bữa sáng.)',
      meta: {
        sentences: [
          {
            text: 'I like to ___ cereal.',
            correctAnswer: 'eat',
            options: ['eat', 'drink', 'cook', 'boil'],
          },
          {
            text: 'I like to ___ milk for breakfast.',
            correctAnswer: 'drink',
            options: ['eat', 'drink', 'cook', 'boil'],
          },
        ],
        context: 'Hai hành động cơ bản với thức ăn và đồ uống (ăn và uống).',
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt:
        'Trong các từ sau, từ nào KHÔNG phải là động từ chỉ cách chế biến món ăn?',
      meta: {
        question: 'Động từ nào KHÔNG phải là động từ chỉ cách chế biến món ăn?',
        options: [
          { text: 'Boil', order: -1 },
          { text: 'Fry', order: -1 },
          { text: 'Cook', order: -1 },
          { text: 'Drink', order: 1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Cook" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Cook" (kʊk) - Nấu ăn (Động từ)',
        expectedText: 'Cook',
      },
    },
  ];
  const exerciseDataLesson5 = [
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Ngon"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Ngon"?',
        options: [
          { text: 'Hungry', order: -1 },
          { text: 'Fresh', order: -1 },
          { text: 'Delicious', order: 1 },
          { text: 'Quick', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt:
        'Hoàn thành câu: "I skipped dinner, so I am very __ this morning." (Tôi bỏ bữa tối, nên sáng nay tôi rất đói.)',
      meta: {
        sentences: [
          {
            text: 'I skipped dinner, so I am very ___ this morning.',
            correctAnswer: 'hungry',
            options: ['hungry', 'delicious', 'healthy', 'quick'],
          },
        ],
        context: 'Tính từ mô tả cảm giác muốn ăn.',
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Lành mạnh"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Lành mạnh"?',
        options: [
          { text: 'Quick', order: -1 },
          { text: 'Healthy', order: 1 },
          { text: 'Delicious', order: -1 },
          { text: 'Fresh', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt:
        'Hoàn thành câu: "I need a __ meal because I am late. The fruit must be __." (Tôi cần một bữa ăn nhanh vì tôi bị trễ. Trái cây phải tươi.)',
      meta: {
        sentences: [
          {
            text: 'I need a ___ meal because I am late.',
            correctAnswer: 'quick',
            options: ['quick', 'fresh', 'hungry', 'delicious'],
          },
          {
            text: 'The fruit must be ___ .',
            correctAnswer: 'fresh',
            options: ['quick', 'fresh', 'hungry', 'delicious'],
          },
        ],
        context: 'Tính từ mô tả tốc độ và chất lượng.',
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Fresh" có nghĩa là gì?',
      meta: {
        question: '"Fresh" có nghĩa là gì?',
        options: [
          { text: 'Nhanh chóng', order: -1 },
          { text: 'Đói', order: -1 },
          { text: 'Tươi (mới)', order: 1 },
          { text: 'Ngon', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Delicious" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Delicious" (dɪˈlɪʃəs) - Ngon (Tính từ)',
        expectedText: 'Delicious',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Healthy" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Healthy" (ˈhelθi) - Lành mạnh (Tính từ)',
        expectedText: 'Healthy',
      },
    },
  ];

  const level1ExerciseData: any[] = [
    exerciseDataLesson1,
    exerciseDataLesson2,
    exerciseDataLesson3,
    exerciseDataLesson4,
    exerciseDataLesson5,
  ];

  for (let i = 0; i < level1Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skill1.id,
        skillLevel: 1,
        title: level1Lessons[i].title,
        position: i + 1,
      },
    });

    const exerciseData = level1ExerciseData[i];

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: exerciseData[j].exerciseType,
          prompt: exerciseData[j].prompt,
          meta: exerciseData[j].meta,
          position: j + 1,
        },
      });

      const lessonWords = level1Lessons[i].words;
      for (const word of lessonWords) {
        await prisma.exerciseWord.create({
          data: {
            exerciseId: exercise.id,
            wordId: word.id,
          },
        });
      }
    }
  }

  console.log('✅ Created Level 1: New word learning');

  // Level 2: New grammars learning - multiple choice to complete sentences
  const level2Lessons = [
    { title: 'Present Simple - Basic Usage', grammarRule: createdGrammars[0] },
    {
      title: 'Present Continuous - Actions in Progress',
      grammarRule: createdGrammars[1],
    },
    { title: 'Mixed Grammar Practice', grammarRule: null },
  ];

  for (let i = 0; i < level2Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skill1.id,
        skillLevel: 2,
        title: level2Lessons[i].title,
        position: i + 1,
      },
    });

    let exerciseData: any[] = [];

    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'She studies English every day.',
            options: [
              { text: 'Cô ấy', order: 1 },
              { text: 'học', order: 2 },
              { text: 'tiếng Anh', order: 3 },
              { text: 'mỗi ngày', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'The sun rises in the east.',
            options: [
              { text: 'Mặt trời', order: 1 },
              { text: 'mọc', order: 2 },
              { text: 'ở', order: 3 },
              { text: 'phía đông', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Họ ăn sáng lúc 7 giờ sáng mỗi ngày.',
            options: [
              { text: 'They', order: 1 },
              { text: 'eat', order: 2 },
              { text: 'breakfast', order: 3 },
              { text: 'at 7 AM every morning', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Bố tôi uống cà phê mỗi sáng.',
            options: [
              { text: 'My father', order: 1 },
              { text: 'drinks', order: 2 },
              { text: 'coffee', order: 3 },
              { text: 'every morning', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Tàu hỏa khởi hành lúc 9 giờ tối mỗi ngày.',
            options: [
              { text: 'The train', order: 1 },
              { text: 'leaves', order: 2 },
              { text: 'at 9 PM', order: 3 },
              { text: 'every day', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'She is studying English right now.',
            options: [
              { text: 'Cô ấy', order: 1 },
              { text: 'đang', order: 2 },
              { text: 'học', order: 3 },
              { text: 'tiếng Anh', order: 4 },
              { text: 'ngay bây giờ', order: 5 },
            ],
            correctOrder: [1, 2, 3, 4, 5],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'They are playing football at the moment.',
            options: [
              { text: 'Họ', order: 1 },
              { text: 'đang', order: 2 },
              { text: 'chơi', order: 3 },
              { text: 'bóng đá', order: 4 },
              { text: 'lúc này', order: 5 },
            ],
            correctOrder: [1, 2, 3, 4, 5],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Chúng tôi đang ăn tối bây giờ.',
            options: [
              { text: 'We', order: 1 },
              { text: 'are having', order: 2 },
              { text: 'dinner', order: 3 },
              { text: 'now', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Tôi đang nấu bữa sáng lúc này.',
            options: [
              { text: 'I', order: 1 },
              { text: 'am cooking', order: 2 },
              { text: 'my breakfast', order: 3 },
              { text: 'at the moment', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Bọn trẻ đang uống nước ép của chúng bây giờ.',
            options: [
              { text: 'The children', order: 1 },
              { text: 'are drinking', order: 2 },
              { text: 'their juice', order: 3 },
              { text: 'now', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question:
              'I usually eat cereal for breakfast, but today I am eating eggs.',
            options: [
              { text: 'Tôi thường', order: 1 },
              { text: 'ăn ngũ cốc', order: 2 },
              { text: 'cho bữa sáng', order: 3 },
              { text: 'nhưng hôm nay', order: 4 },
              { text: 'tôi đang ăn', order: 5 },
              { text: 'trứng', order: 6 },
            ],
            correctOrder: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question:
              'Cô ấy uống cà phê mỗi sáng, nhưng cô ấy đang uống trà ngay bây giờ.',
            options: [
              { text: 'She drinks', order: 1 },
              { text: 'coffee', order: 2 },
              { text: 'every morning', order: 3 },
              { text: 'but she', order: 4 },
              { text: 'is drinking', order: 5 },
              { text: 'tea right now', order: 6 },
            ],
            correctOrder: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'The sun rises in the east, and it is rising now.',
            options: [
              { text: 'Mặt trời', order: 1 },
              { text: 'mọc', order: 2 },
              { text: 'ở phía đông', order: 3 },
              { text: 'và nó', order: 4 },
              { text: 'đang mọc', order: 5 },
              { text: 'bây giờ', order: 6 },
            ],
            correctOrder: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question:
              'Chúng tôi luôn ăn trái cây tươi, và chúng tôi đang ăn một ít táo lúc này.',
            options: [
              { text: 'We always', order: 1 },
              { text: 'eat', order: 2 },
              { text: 'fresh fruit', order: 3 },
              { text: 'and we', order: 4 },
              { text: 'are eating', order: 5 },
              { text: 'some apples now', order: 6 },
            ],
            correctOrder: [1, 2, 3, 4, 5, 6],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt:
            'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question:
              'My dad cooks eggs every Sunday, and he is cooking them right now.',
            options: [
              { text: 'Bố tôi', order: 1 },
              { text: 'nấu trứng', order: 2 },
              { text: 'mỗi Chủ nhật', order: 3 },
              { text: 'và ông ấy', order: 4 },
              { text: 'đang nấu', order: 5 },
              { text: 'chúng ngay bây giờ', order: 6 },
            ],
            correctOrder: [1, 2, 3, 4, 5, 6],
          },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: exerciseData[j].exerciseType,
          prompt: exerciseData[j].prompt,
          meta: exerciseData[j].meta,
          position: j + 1,
        },
      });

      const grammarRule = level2Lessons[i].grammarRule;
      if (grammarRule) {
        await prisma.exerciseGrammar.create({
          data: {
            exerciseId: exercise.id,
            grammarId: grammarRule.id,
          },
        });
      } else {
        for (const grammar of createdGrammars) {
          await prisma.exerciseGrammar.create({
            data: {
              exerciseId: exercise.id,
              grammarId: grammar.id,
            },
          });
        }
      }
    }
  }

  console.log(
    '✅ Created Level 2: Grammar learning with multiple choice exercises',
  );

  // Level 3: Mixed Practice
  const level3Lessons = [
    {
      title: 'Review & Practice',
      description: 'Mixed vocabulary and grammar review',
    },
    {
      title: 'Advanced Practice',
      description: 'Advanced exercises with writing and translation',
    },
    {
      title: 'Comprehensive Review',
      description: 'Final comprehensive practice',
    },
  ];

  for (let i = 0; i < level3Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skill1.id,
        skillLevel: 3,
        title: level3Lessons[i].title,
        position: i + 1,
      },
    });

    let exerciseData: any[] = [];

    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu sau sang tiếng Việt:',
          meta: {
            sourceText: 'I eat bread for breakfast.',
            correctAnswer: 'Tôi ăn bánh mì cho bữa sáng.',
            hints: ['bread = bánh mì', 'breakfast = bữa sáng'],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng theo nghĩa tiếng Việt đã cho:',
          meta: {
            question: 'Tôi uống sữa mỗi sáng.',
            options: [
              { text: 'I drink milk every morning.', order: 1 },
              { text: 'I am drinking milk every morning.', order: -1 },
              { text: 'I drank milk every morning.', order: -1 },
              { text: 'I will drink milk every morning.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành câu với từ vựng phù hợp:',
          meta: {
            sentences: [
              {
                text: 'I eat ___ for breakfast.',
                correctAnswer: 'egg',
                options: ['egg', 'milk', 'juice', 'water'],
              },
              {
                text: 'The coffee is very ___.',
                correctAnswer: 'hot',
                options: ['hot', 'cold', 'fresh', 'sweet'],
              },
            ],
            context: 'Sử dụng từ vựng cơ bản về đồ ăn sáng.',
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to câu sau với phát âm chuẩn:',
          meta: {
            prompt: 'Phát âm câu: "I eat bread and drink milk"',
            expectedText: 'I eat bread and drink milk',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một đoạn văn ngắn mô tả thói quen ăn sáng của bạn:',
          meta: {
            prompt:
              'Describe your breakfast. What do you eat and drink? Use at least 30 words.',
            minWords: 30,
            maxWords: 60,
            exampleAnswer:
              'I eat bread and drink milk for breakfast. I like eggs too. I have breakfast at 7 AM. My breakfast is good and healthy.',
            criteria: ['simple grammar', 'basic vocabulary'],
          },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu sau sang tiếng Anh:',
          meta: {
            sourceText: 'Tôi uống nước cam mỗi sáng.',
            correctAnswer: 'I drink orange juice every morning.',
            hints: ['nước cam = orange juice', 'mỗi sáng = every morning'],
          },
        },
        {
          exerciseType: ExerciseType.match,
          prompt: 'Nối các từ với định nghĩa phù hợp:',
          meta: {
            pairs: [
              { left: 'Coffee', right: 'Cà phê' },
              { left: 'Juice', right: 'Nước ép' },
              { left: 'Hot', right: 'Nóng' },
              { left: 'Sweet', right: 'Ngọt' },
              { left: 'Fresh', right: 'Tươi' },
            ],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ để tạo thành câu hoàn chỉnh:',
          meta: {
            question: 'Tôi ăn trứng vào buổi sáng.',
            options: [
              { text: 'I eat', order: 1 },
              { text: 'eggs', order: 2 },
              { text: 'in the morning', order: 3 },
            ],
            correctOrder: [1, 2, 3],
          },
        },
        {
          exerciseType: ExerciseType.listen_choose,
          prompt: 'Nghe và chọn câu đúng:',
          meta: {
            correctAnswer: 'I drink hot coffee.',
            options: [
              'I drink hot coffee.',
              'I drink cold coffee.',
              'I drink hot tea.',
              'I drink cold tea.',
            ],
            sentence: 'I drink hot coffee.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Mô tả bữa sáng yêu thích của bạn:',
          meta: {
            prompt:
              'Describe your favorite breakfast. What do you like to eat and drink?',
            minWords: 40,
            maxWords: 80,
            exampleAnswer:
              'My favorite breakfast is bread and milk. I like to eat egg too. I drink orange juice. This breakfast is healthy and tasty. I eat breakfast at home.',
            criteria: ['simple sentences', 'basic vocabulary'],
          },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu sau:',
          meta: {
            sourceText: 'She eats eggs and drinks coffee.',
            correctAnswer: 'Cô ấy ăn trứng và uống cà phê.',
            hints: ['eggs = trứng', 'coffee = cà phê'],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành đoạn văn với từ phù hợp:',
          meta: {
            sentences: [
              {
                text: 'Every morning, I ___ breakfast at 7 AM.',
                correctAnswer: 'eat',
                options: ['eat', 'am eating', 'eating', 'eats'],
              },
              {
                text: 'Right now, my sister ___ coffee in the kitchen.',
                correctAnswer: 'is drinking',
                options: ['drinks', 'is drinking', 'drink', 'drinking'],
              },
              {
                text: 'We always choose ___ ingredients for our meals.',
                correctAnswer: 'fresh',
                options: ['fresh', 'quick', 'hungry', 'delicious'],
              },
            ],
            context:
              'Phân biệt thì hiện tại đơn và hiện tại tiếp diễn, sử dụng từ vựng phù hợp.',
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu có cấu trúc ngữ pháp đúng:',
          meta: {
            question:
              'Câu nào diễn tả đúng ý: "Tôi thường uống cà phê, nhưng hôm nay tôi đang uống trà"?',
            options: [
              {
                text: 'I usually drink coffee, but today I drink tea.',
                order: -1,
              },
              {
                text: 'I usually drink coffee, but today I am drinking tea.',
                order: 1,
              },
              {
                text: 'I am usually drinking coffee, but today I drink tea.',
                order: -1,
              },
              {
                text: 'I usually am drinking coffee, but today I am drinking tea.',
                order: -1,
              },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to đoạn văn sau với phát âm và ngữ điệu tự nhiên:',
          meta: {
            prompt:
              'Đọc: "Breakfast is the most important meal of the day. I always eat nutritious food like fresh fruit, healthy cereal, and drink delicious coffee."',
            expectedText:
              'Breakfast is the most important meal of the day. I always eat nutritious food like fresh fruit, healthy cereal, and drink delicious coffee.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một bài luận ngắn về tầm quan trọng của bữa sáng:',
          meta: {
            prompt:
              'Write a short essay about the importance of breakfast. Include your personal experiences, health benefits, and cultural aspects. Use both present simple and present continuous tenses appropriately.',
            minWords: 120,
            maxWords: 200,
            exampleAnswer:
              'Breakfast is essential for starting the day with energy. I always eat a balanced breakfast because it helps me concentrate better at work. Traditional breakfast foods like eggs and toast provide important nutrients. Currently, many people are choosing healthier options like fresh fruit and yogurt. In my culture, we usually share breakfast with family, which strengthens our relationships. I am learning that a good breakfast affects my entire day positively.',
            criteria: [
              'essay structure',
              'grammar variety',
              'vocabulary richness',
              'cultural awareness',
            ],
          },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: exerciseData[j].exerciseType,
          prompt: exerciseData[j].prompt,
          meta: exerciseData[j].meta,
          position: j + 1,
        },
      });

      for (const word of createdWords) {
        await prisma.exerciseWord.create({
          data: { exerciseId: exercise.id, wordId: word.id },
        });
      }

      for (const grammar of createdGrammars) {
        await prisma.exerciseGrammar.create({
          data: { exerciseId: exercise.id, grammarId: grammar.id },
        });
      }
    }
  }

  console.log(
    '✅ Created Level 3: Mixed practice with writing and translation',
  );

  // Level 4: Listening Comprehension - Podcast with dialogue
  const level4Lessons = [
    {
      title: 'Breakfast Conversation',
      description: 'Listen to a dialogue about breakfast habits',
    },
  ];

  for (let i = 0; i < level4Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skill1.id,
        skillLevel: 4,
        title: level4Lessons[i].title,
        position: i + 1,
      },
    });

    const exerciseData = [
      {
        exerciseType: ExerciseType.podcast,
        prompt:
          'Nghe đoạn hội thoại giữa Emma và David về thói quen ăn sáng của họ, sau đó trả lời các câu hỏi:',
        meta: {
          title: 'Breakfast Conversation Between Emma and David',
          description:
            'A dialogue about healthy breakfast habits and morning routines',
          showTranscript: true,
          media: { type: 'none', url: null, thumbnailUrl: null },
          segments: [
            {
              order: 1,
              transcript: `Hi David! I noticed you always have such a healthy breakfast. What do you usually eat in the morning?`,
              voiceGender: 'female',
              questions: null,
            },
            {
              order: 2,
              transcript: `Oh, thanks Emma! I try to eat nutritious food to start my day right. I usually have fresh fruit, yogurt, and some whole grain cereal. Sometimes I cook eggs on weekends. What about you?`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'match',
                  question: 'Nối các thực phẩm David ăn với mô tả của chúng:',
                  pairs: [
                    { left: 'Fresh fruit', right: 'Trái cây tươi' },
                    { left: 'Yogurt', right: 'Sữa chua' },
                    { left: 'Cereal', right: 'Ngũ cốc' },
                    { left: 'Eggs', right: 'Trứng' },
                  ],
                },
              ],
            },
            {
              order: 3,
              transcript: `Well, I'm always in a hurry in the mornings. I usually just grab a quick coffee and maybe a muffin on my way to work. I know it's not very healthy.`,
              voiceGender: 'female',
              questions: [
                {
                  type: 'trueFalse',
                  statement: 'Emma always has a healthy breakfast.',
                  correctAnswer: false,
                  explanation:
                    'Emma thường chỉ uống cà phê và ăn bánh muffin vội vàng, không phải bữa sáng lành mạnh.',
                },
              ],
            },
            {
              order: 4,
              transcript: `That sounds quite rushed! You know, I used to do the same thing when I was younger. But now I wake up 15 minutes earlier to prepare a proper breakfast. It really makes a difference in my energy levels throughout the day.`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'listenChoose',
                  question: 'Chọn các từ bạn nghe được trong đoạn này:',
                  correctWords: ['rushed', 'wake up', 'prepare', 'energy'],
                  distractorWords: ['sleep', 'dinner', 'tired', 'coffee'],
                },
              ],
            },
            {
              order: 5,
              transcript: `That's a good idea. I am trying to change my habits. Actually, this week I started drinking fresh juice instead of just coffee. And yesterday I had some toast with jam instead of a store-bought muffin.`,
              voiceGender: 'female',
              questions: [
                {
                  type: 'multipleChoice',
                  question: 'What change has Emma started making this week?',
                  options: [
                    'Waking up earlier',
                    'Cooking eggs every day',
                    'Drinking fresh juice instead of just coffee',
                    'Preparing overnight oats',
                  ],
                  correctAnswer: 'Drinking fresh juice instead of just coffee',
                },
              ],
            },
            {
              order: 6,
              transcript: `That's great progress! Small changes can make a big difference. Do you like to cook?`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'trueFalse',
                  statement:
                    'David thinks small changes cannot make a difference.',
                  correctAnswer: false,
                  explanation:
                    'David nói "Small changes can make a big difference" - những thay đổi nhỏ có thể tạo ra sự khác biệt lớn.',
                },
              ],
            },
            {
              order: 7,
              transcript: `I enjoy cooking dinner, but mornings are always so hectic for me. Maybe I should prepare something the night before?`,
              voiceGender: 'female',
              questions: [
                {
                  type: 'match',
                  question: 'Ghép các từ tiếng Anh với nghĩa tiếng Việt:',
                  pairs: [
                    { left: 'enjoy', right: 'thích' },
                    { left: 'hectic', right: 'bận rộn' },
                    { left: 'prepare', right: 'chuẩn bị' },
                    { left: 'night before', right: 'đêm trước' },
                  ],
                },
              ],
            },
            {
              order: 8,
              transcript: `Absolutely! I sometimes prepare overnight oats or cut fresh fruit the evening before. It saves time and ensures I eat something nutritious. You could also boil some eggs in advance.`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'listenChoose',
                  question:
                    'Chọn các từ về cách chế biến thức ăn bạn nghe thấy:',
                  correctWords: ['prepare', 'cut', 'boil'],
                  distractorWords: ['fry', 'bake', 'grill', 'steam'],
                },
              ],
            },
            {
              order: 9,
              transcript: `Those are excellent suggestions! I think I'll try the overnight oats idea. Do you add any syrup or honey to make them sweet?`,
              voiceGender: 'female',
              questions: [
                {
                  type: 'multipleChoice',
                  question: 'What is Emma planning to try?',
                  options: [
                    'Boiled eggs',
                    'Fresh fruit',
                    'Overnight oats',
                    'Whole grain cereal',
                  ],
                  correctAnswer: 'Overnight oats',
                },
              ],
            },
            {
              order: 10,
              transcript: `Sometimes I add a little honey or fresh berries. It's much healthier than processed sugar. The natural sweetness from fruit is really delicious too.`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'trueFalse',
                  statement:
                    'David uses processed sugar to make his oats sweet.',
                  correctAnswer: false,
                  explanation:
                    'David dùng mật ong hoặc quả mọng tươi, không dùng đường chế biến (processed sugar).',
                },
              ],
            },
            {
              order: 11,
              transcript: `I'll definitely try that this weekend. Thanks for all the advice, David!`,
              voiceGender: 'female',
              questions: null,
            },
            {
              order: 12,
              transcript: `You're welcome! I'm sure you'll feel much more energetic once you establish a healthy breakfast routine.`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'match',
                  question: 'Ghép các từ với nghĩa của chúng trong ngữ cảnh:',
                  pairs: [
                    { left: 'energetic', right: 'tràn đầy năng lượng' },
                    { left: 'establish', right: 'thiết lập' },
                    { left: 'routine', right: 'thói quen' },
                    { left: 'healthy', right: 'lành mạnh' },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: exerciseData[j].exerciseType,
          prompt: exerciseData[j].prompt,
          meta: exerciseData[j].meta,
          position: j + 1,
        },
      });

      for (const word of createdWords) {
        await prisma.exerciseWord.create({
          data: { exerciseId: exercise.id, wordId: word.id },
        });
      }

      for (const grammar of createdGrammars) {
        await prisma.exerciseGrammar.create({
          data: { exerciseId: exercise.id, grammarId: grammar.id },
        });
      }
    }
  }

  console.log('✅ Created Level 4: Podcast listening comprehension');

  // Level 5: Practice Review
  const level5Lessons = [
    {
      title: 'Basic Review & Practice',
      description: 'Review vocabulary and simple grammar',
    },
    {
      title: 'Simple Communication',
      description: 'Basic breakfast conversations',
    },
    {
      title: 'Final Review',
      description: 'Complete practice with simple writing',
    },
  ];

  for (let i = 0; i < level5Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skill1.id,
        skillLevel: 5,
        title: level5Lessons[i].title,
        position: i + 1,
      },
    });

    let exerciseData: any[] = [];

    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu đơn giản sau:',
          meta: {
            sourceText: 'We eat healthy food for breakfast.',
            correctAnswer: 'Chúng tôi ăn thức ăn lành mạnh cho bữa sáng.',
            hints: ['healthy = lành mạnh', 'food = thức ăn'],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng ngữ pháp:',
          meta: {
            question: 'Câu nào đúng?',
            options: [
              { text: 'They eat healthy breakfast every day.', order: 1 },
              { text: 'They eating healthy breakfast every day.', order: -1 },
              { text: 'They are eat healthy breakfast every day.', order: -1 },
              { text: 'They eats healthy breakfast every day.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành câu với từ vựng cơ bản:',
          meta: {
            sentences: [
              {
                text: 'The coffee is very ___.',
                correctAnswer: 'hot',
                options: ['hot', 'cold', 'sweet', 'fresh'],
              },
              {
                text: 'I ___ breakfast at home.',
                correctAnswer: 'eat',
                options: ['eat', 'drink', 'cook', 'make'],
              },
              {
                text: 'Fresh ___ is good for health.',
                correctAnswer: 'fruit',
                options: ['fruit', 'bread', 'coffee', 'milk'],
              },
            ],
            context: 'Sử dụng từ vựng cơ bản về bữa sáng.',
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to câu sau:',
          meta: {
            prompt: 'Phát âm: "Breakfast is important for good health"',
            expectedText: 'Breakfast is important for good health',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về lợi ích của bữa sáng:',
          meta: {
            prompt: 'Write about why breakfast is good. Use simple sentences.',
            minWords: 40,
            maxWords: 80,
            exampleAnswer:
              'Breakfast is very important. It gives me energy for the day. I eat healthy food like fruit and bread. I drink milk or juice. Breakfast helps me feel good. I can study better when I eat breakfast.',
            criteria: ['simple sentences', 'basic vocabulary', 'clear ideas'],
          },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch đoạn hội thoại đơn giản:',
          meta: {
            sourceText:
              'What do you usually eat for breakfast? I eat bread and drink coffee.',
            correctAnswer:
              'Bạn thường ăn gì cho bữa sáng? Tôi ăn bánh mì và uống cà phê.',
            hints: ['usually = thường', 'breakfast = bữa sáng'],
          },
        },
        {
          exerciseType: ExerciseType.match,
          prompt: 'Nối các từ với nghĩa tiếng Việt:',
          meta: {
            pairs: [
              { left: 'Breakfast', right: 'Bữa sáng' },
              { left: 'Delicious', right: 'Ngon' },
              { left: 'Healthy', right: 'Lành mạnh' },
              { left: 'Quick', right: 'Nhanh' },
              { left: 'Cook', right: 'Nấu' },
            ],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu trả lời đúng trong hội thoại:',
          meta: {
            question: 'A: "Do you like breakfast?" B: "___"',
            options: [
              { text: 'Yes, I like breakfast very much.', order: 1 },
              { text: 'Yes, I am like breakfast very much.', order: -1 },
              { text: 'Yes, I liking breakfast very much.', order: -1 },
              { text: 'Yes, I likes breakfast very much.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.listen_choose,
          prompt: 'Nghe và chọn câu đúng:',
          meta: {
            correctAnswer: 'I eat fruit and yogurt for breakfast.',
            options: [
              'I eat fruit and yogurt for breakfast.',
              'I eat bread and yogurt for breakfast.',
              'I eat fruit and cheese for breakfast.',
              'I eat meat and yogurt for breakfast.',
            ],
            sentence: 'I eat fruit and yogurt for breakfast.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một đoạn hội thoại về bữa sáng:',
          meta: {
            prompt:
              'Write a simple conversation between two people talking about breakfast.',
            minWords: 50,
            maxWords: 100,
            exampleAnswer:
              'A: What do you eat for breakfast? B: I eat bread and drink milk. What about you? A: I like eggs and coffee. B: That sounds good. Do you cook breakfast? A: Yes, I cook eggs every morning. B: I usually eat quick breakfast because I am busy.',
            criteria: [
              'simple dialogue',
              'basic vocabulary',
              'natural conversation',
            ],
          },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu về văn hóa ăn sáng:',
          meta: {
            sourceText: 'In my country, people eat rice for breakfast.',
            correctAnswer: 'Ở đất nước tôi, mọi người ăn cơm cho bữa sáng.',
            hints: ['country = đất nước', 'people = mọi người', 'rice = cơm'],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành câu với từ vựng phù hợp:',
          meta: {
            sentences: [
              {
                text: 'Different countries have different ___ for breakfast.',
                correctAnswer: 'foods',
                options: ['foods', 'drinks', 'ways', 'times'],
              },
              {
                text: 'In America, people often eat ___ for breakfast.',
                correctAnswer: 'cereal',
                options: ['cereal', 'rice', 'soup', 'pizza'],
              },
              {
                text: 'Breakfast is ___ in every culture.',
                correctAnswer: 'important',
                options: ['important', 'difficult', 'expensive', 'quick'],
              },
            ],
            context: 'Sử dụng từ vựng về văn hóa ăn sáng ở các nước khác nhau.',
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng về văn hóa ăn sáng:',
          meta: {
            question: 'Câu nào nói về sự khác biệt văn hóa trong ăn sáng?',
            options: [
              {
                text: 'People in different countries eat different breakfast foods.',
                order: 1,
              },
              {
                text: 'All people in the world eat the same breakfast.',
                order: -1,
              },
              {
                text: 'Only Americans eat breakfast in the morning.',
                order: -1,
              },
              { text: 'Breakfast is not important in any culture.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc câu về văn hóa ăn sáng:',
          meta: {
            prompt: 'Đọc: "Breakfast customs are different around the world"',
            expectedText: 'Breakfast customs are different around the world',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về sự khác biệt văn hóa trong ăn sáng:',
          meta: {
            prompt:
              'Write about how breakfast is different in different countries. Use simple sentences.',
            minWords: 50,
            maxWords: 100,
            exampleAnswer:
              'People eat different foods for breakfast around the world. In America, people eat cereal and pancakes. In Japan, people eat rice and fish. In England, people eat eggs and bacon. In my country, we eat bread and drink tea. All cultures think breakfast is important for health.',
            criteria: [
              'simple sentences',
              'cultural comparison',
              'basic vocabulary',
            ],
          },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: exerciseData[j].exerciseType,
          prompt: exerciseData[j].prompt,
          meta: exerciseData[j].meta,
          position: j + 1,
        },
      });

      for (const word of createdWords) {
        await prisma.exerciseWord.create({
          data: { exerciseId: exercise.id, wordId: word.id },
        });
      }

      for (const grammar of createdGrammars) {
        await prisma.exerciseGrammar.create({
          data: { exerciseId: exercise.id, grammarId: grammar.id },
        });
      }
    }
  }

  console.log(
    '✅ Created Level 5: Practice review with beginner-friendly exercises',
  );

  // Level 6: Image Description & Writing
  const level6Lessons = [
    {
      title: 'Describing Breakfast Foods',
      description: 'Look at pictures and describe breakfast foods',
    },
    {
      title: 'People Eating Breakfast',
      description: 'Describe what people are eating for breakfast',
    },
    {
      title: 'Breakfast Drinks',
      description: 'Describe breakfast drinks and beverages',
    },
  ];

  for (let i = 0; i < level6Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skill1.id,
        skillLevel: 6,
        title: level6Lessons[i].title,
        position: i + 1,
      },
    });

    let exerciseData: any[] = [];

    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.image_description,
          prompt: 'Nhìn vào hình ảnh và mô tả những gì bạn thấy:',
          meta: {
            imageUrl:
              'https://res.cloudinary.com/diugsirlo/image/upload/v1759991987/the-rock-pancakes-505a746c1cf94b9d8823b69a777b1949_crq8rz.jpg',
            prompt:
              'Describe what you see in this picture. What is the man eating?',
            expectedResults:
              'A man is eating pancakes. He looks happy. The pancakes look delicious.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về bánh kếp (pancakes):',
          meta: {
            prompt:
              'Write about pancakes. Do you like them? When do you eat them?',
            minWords: 30,
            maxWords: 60,
            exampleAnswer:
              'Pancakes are very delicious. I like to eat pancakes for breakfast. They are sweet and soft. I eat pancakes with syrup. My family likes pancakes too.',
            criteria: [
              'simple sentences',
              'basic vocabulary',
              'personal opinion',
            ],
          },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.image_description,
          prompt: 'Nhìn vào hình ảnh và mô tả những gì bạn thấy:',
          meta: {
            imageUrl:
              'https://res.cloudinary.com/diugsirlo/image/upload/v1759991848/breakfast_uops7r.jpg',
            prompt:
              'Describe what you see in this picture. What is the woman eating?',
            expectedResults:
              'A woman is eating cereal. She is having breakfast. The cereal looks healthy.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về ngũ cốc (cereal):',
          meta: {
            prompt:
              'Write about cereal. Do you eat cereal for breakfast? What do you eat it with?',
            minWords: 30,
            maxWords: 60,
            exampleAnswer:
              'Cereal is a healthy breakfast. I eat cereal with milk. It tastes good. Cereal gives me energy. I eat cereal every morning before school.',
            criteria: [
              'simple sentences',
              'basic vocabulary',
              'personal experience',
            ],
          },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.image_description,
          prompt: 'Nhìn vào hình ảnh và mô tả những gì bạn thấy:',
          meta: {
            imageUrl:
              'https://res.cloudinary.com/diugsirlo/image/upload/v1759991902/man-drinking-orange-juice_tzyotm.jpg',
            prompt:
              'Describe what you see in this picture. What is the man drinking?',
            expectedResults:
              'A man is drinking orange juice. The juice looks fresh. He is enjoying his drink.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về đồ uống buổi sáng:',
          meta: {
            prompt:
              'Write about breakfast drinks. What do you like to drink in the morning?',
            minWords: 30,
            maxWords: 60,
            exampleAnswer:
              'I like to drink orange juice for breakfast. It is fresh and sweet. Sometimes I drink coffee or milk. Breakfast drinks are important. They help me start the day.',
            criteria: [
              'simple sentences',
              'basic vocabulary',
              'personal preference',
            ],
          },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: exerciseData[j].exerciseType,
          prompt: exerciseData[j].prompt,
          meta: exerciseData[j].meta,
          position: j + 1,
        },
      });

      for (const word of createdWords) {
        await prisma.exerciseWord.create({
          data: { exerciseId: exercise.id, wordId: word.id },
        });
      }

      for (const grammar of createdGrammars) {
        await prisma.exerciseGrammar.create({
          data: { exerciseId: exercise.id, grammarId: grammar.id },
        });
      }
    }
  }

  console.log('✅ Created Level 6: Image description & writing exercises');

  // Level 7: Final Assessment
  const level7Lessons = [
    {
      title: 'Final Knowledge Assessment',
      description:
        'Test all knowledge learned about breakfast vocabulary and grammar',
    },
  ];

  for (let i = 0; i < level7Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skill1.id,
        skillLevel: 7,
        title: level7Lessons[i].title,
        position: i + 1,
      },
    });

    const exerciseData = [
      {
        exerciseType: ExerciseType.match,
        prompt: 'Kiểm tra từ vựng: Nối các từ với nghĩa đúng',
        meta: {
          pairs: [
            { left: 'Breakfast', right: 'Bữa ăn sáng' },
            { left: 'Delicious', right: 'Ngon' },
            { left: 'Healthy', right: 'Lành mạnh' },
            { left: 'Fresh', right: 'Tươi' },
            { left: 'Quick', right: 'Nhanh' },
          ],
        },
      },
      {
        exerciseType: ExerciseType.multiple_choice,
        prompt: 'Kiểm tra ngữ pháp: Chọn câu đúng',
        meta: {
          question: 'Câu nào sử dụng đúng thì hiện tại tiếp diễn?',
          options: [
            { text: 'I eat breakfast every day.', order: -1 },
            { text: 'I am eating breakfast right now.', order: 1 },
            { text: 'I eating breakfast now.', order: -1 },
            { text: 'I eats breakfast now.', order: -1 },
          ],
          correctOrder: [1],
        },
      },
      {
        exerciseType: ExerciseType.fill_blank,
        prompt: 'Hoàn thành đoạn văn với từ vựng và ngữ pháp đúng:',
        meta: {
          sentences: [
            {
              text: 'Every morning, I ___ a healthy breakfast.',
              correctAnswer: 'eat',
              options: ['eat', 'eating', 'am eating', 'eats'],
            },
            {
              text: 'Right now, my sister ___ coffee in the kitchen.',
              correctAnswer: 'is drinking',
              options: ['drink', 'drinks', 'is drinking', 'drinking'],
            },
            {
              text: 'Pancakes with ___ syrup taste very good.',
              correctAnswer: 'sweet',
              options: ['sweet', 'hungry', 'quick', 'cook'],
            },
          ],
          context:
            'Kiểm tra khả năng sử dụng từ vựng và ngữ pháp trong ngữ cảnh.',
        },
      },
      {
        exerciseType: ExerciseType.translate,
        prompt: 'Dịch câu sau để kiểm tra hiểu biết tổng thể:',
        meta: {
          sourceText:
            'My family usually eats fresh fruit and drinks coffee for breakfast, but today we are having pancakes.',
          correctAnswer:
            'Gia đình tôi thường ăn trái cây tươi và uống cà phê cho bữa sáng, nhưng hôm nay chúng tôi đang ăn bánh kếp.',
          hints: [
            'usually = thường',
            'fresh = tươi',
            'but today = nhưng hôm nay',
            'are having = đang ăn',
          ],
        },
      },
      {
        exerciseType: ExerciseType.speak,
        prompt: 'Đọc câu tổng hợp kiến thức đã học:',
        meta: {
          prompt:
            'Đọc: "I love eating healthy breakfast with fresh fruit, delicious pancakes, and hot coffee every morning"',
          expectedText:
            'I love eating healthy breakfast with fresh fruit, delicious pancakes, and hot coffee every morning',
        },
      },
      {
        exerciseType: ExerciseType.listen_choose,
        prompt: 'Nghe và chọn câu đúng:',
        meta: {
          correctAnswer: 'She always cooks eggs and bacon for breakfast.',
          options: [
            'She always cooks eggs and bacon for breakfast.',
            'She always eats eggs and bacon for breakfast.',
            'She always drinks eggs and bacon for breakfast.',
            'She always makes eggs and bacon for breakfast.',
          ],
          sentence: 'She always cooks eggs and bacon for breakfast.',
        },
      },
      {
        exerciseType: ExerciseType.image_description,
        prompt: 'Mô tả toàn diện những gì bạn thấy:',
        meta: {
          imageUrl:
            'https://res.cloudinary.com/diugsirlo/image/upload/v1759991987/the-rock-pancakes-505a746c1cf94b9d8823b69a777b1949_crq8rz.jpg',
          prompt:
            'Describe everything you see in this breakfast scene using the vocabulary you have learned.',
          expectedResults:
            'A man is eating delicious pancakes for breakfast. He looks happy and hungry. The pancakes are fresh and sweet. This is a healthy breakfast.',
        },
      },
      {
        exerciseType: ExerciseType.writing_prompt,
        prompt: 'Viết bài tổng hợp toàn bộ kiến thức đã học:',
        meta: {
          prompt:
            'Write about your perfect breakfast. Use vocabulary words, present simple and present continuous tense. Describe what you usually eat and what you are eating today.',
          minWords: 80,
          maxWords: 120,
          exampleAnswer:
            'My perfect breakfast is very healthy and delicious. I usually eat fresh fruit, yogurt, and drink hot coffee every morning. The fruit is sweet and the coffee gives me energy. Today I am eating something special - pancakes with syrup! My sister is cooking eggs and bacon in the kitchen right now. We always enjoy our breakfast together. Breakfast is the most important meal of the day because it helps me feel strong and ready for work.',
          criteria: [
            'vocabulary usage',
            'grammar accuracy',
            'present simple vs continuous',
            'comprehensive knowledge',
          ],
        },
      },
    ];

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: exerciseData[j].exerciseType,
          prompt: exerciseData[j].prompt,
          meta: exerciseData[j].meta,
          position: j + 1,
        },
      });

      for (const word of createdWords) {
        await prisma.exerciseWord.create({
          data: { exerciseId: exercise.id, wordId: word.id },
        });
      }

      for (const grammar of createdGrammars) {
        await prisma.exerciseGrammar.create({
          data: { exerciseId: exercise.id, grammarId: grammar.id },
        });
      }
    }
  }

  console.log('✅ Created Level 7: Final comprehensive assessment');

  console.log('🎉 Seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   • Auth: 2 Roles (USER, ADMIN)`);
  console.log(`   • 2 Skill Parts: ${part1.name}, ${part2.name}`);
  console.log(`   • Part 1: 1 Skill with full content: ${skill1.title}`);
  console.log(`   • Part 2: 2 Empty Skills: ${skill2.title}, ${skill3.title}`);
  console.log(`   • 7 Skill Levels for ${skill1.title}`);
  console.log(`   • ${createdWords.length} Words`);
  console.log(`   • ${createdGrammars.length} Grammar Rules`);
  console.log(`   • Level 1: 5 lessons with vocabulary exercises`);
  console.log(`   • Level 2: 3 lessons with grammar exercises`);
  console.log(
    `   • Level 3: 3 lessons with mixed practice (writing & translation)`,
  );
  console.log(`   • Level 4: 1 lesson with podcast listening comprehension`);
  console.log(`   • Level 5: 3 lessons with beginner-friendly practice`);
  console.log(`   • Level 6: 3 lessons with image description & writing`);
  console.log(`   • Level 7: 1 lesson with final comprehensive assessment`);

  // ============================================================
  // QUESTS & ACHIEVEMENTS
  // ============================================================
  await seedQuestsAndAchievements();
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
