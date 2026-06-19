import { PrismaClient, Word, Grammar, ExerciseType } from '@prisma/client';

export async function seedSkill2(prisma: PrismaClient, skillId: string, tagId: string) {
  console.log('🌱 Seeding Skill 2: Lunch & Dinner Vocabulary...');

  const sampleWords = [
    {
      content: 'Lunch',
      pronunciation: 'lʌntʃ',
      meaning: 'Bữa trưa',
      audioUrl: 'example',
    },
    {
      content: 'Dinner',
      pronunciation: 'ˈdɪnə',
      meaning: 'Bữa tối',
      audioUrl: 'example',
    },
    {
      content: 'Meal',
      pronunciation: 'miːl',
      meaning: 'Bữa ăn',
      audioUrl: 'example',
    },
    {
      content: 'Rice',
      pronunciation: 'raɪs',
      meaning: 'Cơm/Gạo',
      audioUrl: 'example',
    },
    {
      content: 'Meat',
      pronunciation: 'miːt',
      meaning: 'Thịt',
      audioUrl: 'example',
    },
    {
      content: 'Chicken',
      pronunciation: 'ˈtʃɪkɪn',
      meaning: 'Thịt gà',
      audioUrl: 'example',
    },
    {
      content: 'Beef',
      pronunciation: 'biːf',
      meaning: 'Thịt bò',
      audioUrl: 'example',
    },
    {
      content: 'Pork',
      pronunciation: 'pɔːk',
      meaning: 'Thịt lợn',
      audioUrl: 'example',
    },
    {
      content: 'Fish',
      pronunciation: 'fɪʃ',
      meaning: 'Cá',
      audioUrl: 'example',
    },
    {
      content: 'Seafood',
      pronunciation: 'ˈsiːfuːd',
      meaning: 'Hải sản',
      audioUrl: 'example',
    },
    {
      content: 'Soup',
      pronunciation: 'suːp',
      meaning: 'Súp/Canh',
      audioUrl: 'example',
    },
    {
      content: 'Salad',
      pronunciation: 'ˈsæləd',
      meaning: 'Món rau trộn',
      audioUrl: 'example',
    },
    {
      content: 'Vegetable',
      pronunciation: 'ˈvedʒtəbl',
      meaning: 'Rau củ',
      audioUrl: 'example',
    },
    {
      content: 'Potato',
      pronunciation: 'pəˈteɪtəʊ',
      meaning: 'Khoai tây',
      audioUrl: 'example',
    },
    {
      content: 'Tomato',
      pronunciation: 'təˈmɑːtəʊ',
      meaning: 'Cà chua',
      audioUrl: 'example',
    },
    {
      content: 'Onion',
      pronunciation: 'ˈʌnjən',
      meaning: 'Hành tây',
      audioUrl: 'example',
    },
    {
      content: 'Garlic',
      pronunciation: 'ˈɡɑːlɪk',
      meaning: 'Tỏi',
      audioUrl: 'example',
    },
    {
      content: 'Salt',
      pronunciation: 'sɔːlt',
      meaning: 'Muối',
      audioUrl: 'example',
    },
    {
      content: 'Pepper',
      pronunciation: 'ˈpepə',
      meaning: 'Hạt tiêu',
      audioUrl: 'example',
    },
    {
      content: 'Sauce',
      pronunciation: 'sɔːs',
      meaning: 'Nước xốt',
      audioUrl: 'example',
    },
    {
      content: 'Plate',
      pronunciation: 'pleɪt',
      meaning: 'Cái đĩa',
      audioUrl: 'example',
    },
    {
      content: 'Bowl',
      pronunciation: 'bəʊl',
      meaning: 'Cái bát',
      audioUrl: 'example',
    },
    {
      content: 'Fork',
      pronunciation: 'fɔːk',
      meaning: 'Cái nĩa',
      audioUrl: 'example',
    },
    {
      content: 'Spoon',
      pronunciation: 'spuːn',
      meaning: 'Cái thìa',
      audioUrl: 'example',
    },
    {
      content: 'Knife',
      pronunciation: 'naɪf',
      meaning: 'Cái dao',
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
        tagId: tagId,
      },
    });

    createdWords.push(word);
  }

  console.log(`✅ Created ${createdWords.length} words for Skill 2`);

  // Create sample grammar rules
  const grammarRules = [
    {
      rule: 'Countable and Uncountable Nouns',
      explanation:
        'Dùng để phân biệt các loại thức ăn đếm được (như apple, potato) và không đếm được (như water, rice).',
      examples: [
        'I eat an apple.',
        'She drinks some water.',
        'We need some rice.',
        'I have two potatoes.',
      ],
    },
    {
      rule: 'Quantifiers (some, any, much, many)',
      explanation: 'Dùng để chỉ số lượng của thức ăn và đồ uống.',
      examples: [
        'Do you have any sugar?',
        'I don\'t have much time for lunch.',
        'There are some tomatoes on the table.',
        'How many plates do we need?',
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

  console.log(`✅ Created ${createdGrammars.length} grammar rules for Skill 2`);

  // Create skill-word associations
  for (let i = 0; i < createdWords.length; i++) {
    await prisma.skillWord.create({
      data: {
        skillId: skillId,
        wordId: createdWords[i].id,
      },
    });
  }

  // Create skill-grammar associations
  for (const grammar of createdGrammars) {
    await prisma.skillGrammar.create({
      data: {
        skillId: skillId,
        grammarId: grammar.id,
      },
    });
  }

  // Create 7 skill levels (just creating the levels first)
  for (let level = 1; level <= 7; level++) {
    await prisma.skillLevel.create({
      data: {
        skillId: skillId,
        level: level,
      },
    });
  }
  console.log('✅ Created 7 skill levels for Skill 2');

  // Level 1: New word learning - listening exercises with multiple choice
  const level1Lessons = [
    { title: 'Lunch & Dinner Basics 1', words: createdWords.slice(0, 5) },
    { title: 'Lunch & Dinner Basics 2', words: createdWords.slice(5, 10) },
    { title: 'Lunch & Dinner Basics 3', words: createdWords.slice(10, 15) },
    { title: 'Lunch & Dinner Basics 4', words: createdWords.slice(15, 20) },
    { title: 'Lunch & Dinner Basics 5', words: createdWords.slice(20, 25) },
  ];

  const exerciseDataLesson1 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Lunch', right: 'Bữa trưa' },
          { left: 'Dinner', right: 'Bữa tối' },
          { left: 'Meal', right: 'Bữa ăn' },
          { left: 'Rice', right: 'Cơm/Gạo' },
          { left: 'Meat', right: 'Thịt' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Lunch" có nghĩa là gì?',
      meta: {
        question: 'Lunch có nghĩa là gì?',
        options: [
          { text: 'Bữa tối', order: -1 },
          { text: 'Bữa ăn', order: -1 },
          { text: 'Bữa trưa', order: 1 },
          { text: 'Thịt', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Dinner',
        options: ['Lunch', 'Dinner', 'Meal', 'Rice'],
        sentence: 'Dinner',
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Cơm/Gạo"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Cơm/Gạo"?',
        options: [
          { text: 'Meat', order: -1 },
          { text: 'Meal', order: -1 },
          { text: 'Rice', order: 1 },
          { text: 'Dinner', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "I eat __ every day." (Tôi ăn cơm mỗi ngày.)',
      meta: {
        sentences: [
          {
            text: 'I eat ___ every day.',
            correctAnswer: 'rice',
            options: ['rice', 'meat', 'lunch', 'dinner'],
          },
        ],
        context: 'Điền từ vựng liên quan đến thức ăn chính.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Meal" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Meal" (miːl) - Bữa ăn',
        expectedText: 'Meal',
      },
    },
  ];

  const exerciseDataLesson2 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Chicken', right: 'Thịt gà' },
          { left: 'Beef', right: 'Thịt bò' },
          { left: 'Pork', right: 'Thịt lợn' },
          { left: 'Fish', right: 'Cá' },
          { left: 'Seafood', right: 'Hải sản' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Thịt bò"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Thịt bò"?',
        options: [
          { text: 'Chicken', order: -1 },
          { text: 'Pork', order: -1 },
          { text: 'Beef', order: 1 },
          { text: 'Fish', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Seafood" có nghĩa là gì?',
      meta: {
        question: '"Seafood" có nghĩa là gì?',
        options: [
          { text: 'Thịt lợn', order: -1 },
          { text: 'Cá', order: -1 },
          { text: 'Hải sản', order: 1 },
          { text: 'Thịt bò', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Chicken',
        options: ['Beef', 'Pork', 'Fish', 'Chicken'],
        sentence: 'Chicken',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "I prefer __ over __." (Tôi thích thịt gà hơn thịt lợn.)',
      meta: {
        sentences: [
          {
            text: 'I prefer ___ over',
            correctAnswer: 'chicken',
            options: ['chicken', 'beef', 'pork', 'fish'],
          },
          {
            text: 'over ___.',
            correctAnswer: 'pork',
            options: ['chicken', 'beef', 'pork', 'fish'],
          },
        ],
        context: 'Điền hai loại thịt.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Beef" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Beef" (biːf) - Thịt bò',
        expectedText: 'Beef',
      },
    },
  ];

  const exerciseDataLesson3 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Soup', right: 'Súp/Canh' },
          { left: 'Salad', right: 'Món rau trộn' },
          { left: 'Vegetable', right: 'Rau củ' },
          { left: 'Potato', right: 'Khoai tây' },
          { left: 'Tomato', right: 'Cà chua' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Món rau trộn"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Món rau trộn"?',
        options: [
          { text: 'Soup', order: -1 },
          { text: 'Vegetable', order: -1 },
          { text: 'Salad', order: 1 },
          { text: 'Tomato', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Vegetable" có nghĩa là gì?',
      meta: {
        question: '"Vegetable" có nghĩa là gì?',
        options: [
          { text: 'Trái cây', order: -1 },
          { text: 'Rau củ', order: 1 },
          { text: 'Khoai tây', order: -1 },
          { text: 'Súp', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Potato',
        options: ['Tomato', 'Potato', 'Salad', 'Soup'],
        sentence: 'Potato',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "I want a bowl of __." (Tôi muốn một bát súp.)',
      meta: {
        sentences: [
          {
            text: 'I want a bowl of ___.',
            correctAnswer: 'soup',
            options: ['soup', 'salad', 'potato', 'tomato'],
          },
        ],
        context: 'Điền món ăn lỏng.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Tomato" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Tomato" (təˈmɑːtəʊ) - Cà chua',
        expectedText: 'Tomato',
      },
    },
  ];

  const exerciseDataLesson4 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Onion', right: 'Hành tây' },
          { left: 'Garlic', right: 'Tỏi' },
          { left: 'Salt', right: 'Muối' },
          { left: 'Pepper', right: 'Hạt tiêu' },
          { left: 'Sauce', right: 'Nước xốt' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Tỏi"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Tỏi"?',
        options: [
          { text: 'Onion', order: -1 },
          { text: 'Pepper', order: -1 },
          { text: 'Garlic', order: 1 },
          { text: 'Salt', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Pepper" có nghĩa là gì?',
      meta: {
        question: '"Pepper" có nghĩa là gì?',
        options: [
          { text: 'Hành tây', order: -1 },
          { text: 'Tỏi', order: -1 },
          { text: 'Hạt tiêu', order: 1 },
          { text: 'Muối', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Sauce',
        options: ['Salt', 'Pepper', 'Garlic', 'Sauce'],
        sentence: 'Sauce',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "Pass me the __ and __." (Đưa cho tôi muối và tiêu.)',
      meta: {
        sentences: [
          {
            text: 'Pass me the ___',
            correctAnswer: 'salt',
            options: ['salt', 'pepper', 'garlic', 'onion'],
          },
          {
            text: 'and ___.',
            correctAnswer: 'pepper',
            options: ['salt', 'pepper', 'garlic', 'onion'],
          },
        ],
        context: 'Điền hai loại gia vị phổ biến.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Onion" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Onion" (ˈʌnjən) - Hành tây',
        expectedText: 'Onion',
      },
    },
  ];

  const exerciseDataLesson5 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Plate', right: 'Cái đĩa' },
          { left: 'Bowl', right: 'Cái bát' },
          { left: 'Fork', right: 'Cái nĩa' },
          { left: 'Spoon', right: 'Cái thìa' },
          { left: 'Knife', right: 'Cái dao' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Cái thìa"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Cái thìa"?',
        options: [
          { text: 'Fork', order: -1 },
          { text: 'Knife', order: -1 },
          { text: 'Spoon', order: 1 },
          { text: 'Plate', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Fork" có nghĩa là gì?',
      meta: {
        question: '"Fork" có nghĩa là gì?',
        options: [
          { text: 'Cái dao', order: -1 },
          { text: 'Cái bát', order: -1 },
          { text: 'Cái đĩa', order: -1 },
          { text: 'Cái nĩa', order: 1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Knife',
        options: ['Plate', 'Bowl', 'Spoon', 'Knife'],
        sentence: 'Knife',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "I eat soup with a __." (Tôi ăn súp bằng thìa.)',
      meta: {
        sentences: [
          {
            text: 'I eat soup with a ___.',
            correctAnswer: 'spoon',
            options: ['spoon', 'fork', 'knife', 'plate'],
          },
        ],
        context: 'Điền dụng cụ dùng để ăn súp.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Bowl" theo âm thanh mẫu.',
      meta: {
        prompt: 'Phát âm từ "Bowl" (bəʊl) - Cái bát',
        expectedText: 'Bowl',
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
        skillId: skillId,
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

  console.log('✅ Created Level 1: New word learning for Skill 2');

  // Level 2: Grammar learning with multiple choice exercises (Sentence sorting)
  const level2Lessons = [
    { title: 'Countable vs Uncountable Nouns', grammarRule: createdGrammars[0] },
    { title: 'Quantifiers: some, any, much, many', grammarRule: createdGrammars[1] },
    { title: 'Mixed Grammar Practice', grammarRule: null },
  ];

  for (let i = 0; i < level2Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skillId,
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
          prompt: 'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'I have an apple.',
            options: [
              { text: 'Tôi', order: 1 },
              { text: 'có', order: 2 },
              { text: 'một', order: 3 },
              { text: 'quả táo', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Cô ấy uống nước.',
            options: [
              { text: 'She', order: 1 },
              { text: 'drinks', order: 2 },
              { text: 'water', order: 3 },
            ],
            correctOrder: [1, 2, 3],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'We need some rice.',
            options: [
              { text: 'Chúng tôi', order: 1 },
              { text: 'cần', order: 2 },
              { text: 'một ít', order: 3 },
              { text: 'gạo', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Anh ấy ăn hai củ khoai tây.',
            options: [
              { text: 'He', order: 1 },
              { text: 'eats', order: 2 },
              { text: 'two', order: 3 },
              { text: 'potatoes', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'They buy some meat.',
            options: [
              { text: 'Họ', order: 1 },
              { text: 'mua', order: 2 },
              { text: 'một ít', order: 3 },
              { text: 'thịt', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Bạn có chút đường nào không?',
            options: [
              { text: 'Do you', order: 1 },
              { text: 'have', order: 2 },
              { text: 'any', order: 3 },
              { text: 'sugar?', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'I do not have much time.',
            options: [
              { text: 'Tôi', order: 1 },
              { text: 'không có', order: 2 },
              { text: 'nhiều', order: 3 },
              { text: 'thời gian', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Có vài quả cà chua trên bàn.',
            options: [
              { text: 'There are', order: 1 },
              { text: 'some', order: 2 },
              { text: 'tomatoes', order: 3 },
              { text: 'on the table', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'How many plates do we need?',
            options: [
              { text: 'Chúng ta', order: 1 },
              { text: 'cần', order: 2 },
              { text: 'bao nhiêu', order: 3 },
              { text: 'cái đĩa?', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Tôi muốn một ít thịt gà.',
            options: [
              { text: 'I want', order: 1 },
              { text: 'some', order: 2 },
              { text: 'chicken', order: 3 },
            ],
            correctOrder: [1, 2, 3],
          },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Tôi có một quả táo và một ít nước.',
            options: [
              { text: 'I have', order: 1 },
              { text: 'an apple', order: 2 },
              { text: 'and', order: 3 },
              { text: 'some water', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'How much rice do you need?',
            options: [
              { text: 'Bạn', order: 1 },
              { text: 'cần', order: 2 },
              { text: 'bao nhiêu', order: 3 },
              { text: 'gạo?', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Cô ấy không có củ khoai tây nào.',
            options: [
              { text: 'She', order: 1 },
              { text: 'does not have', order: 2 },
              { text: 'any', order: 3 },
              { text: 'potatoes', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Việt theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Anh:',
          meta: {
            question: 'We need many plates for dinner.',
            options: [
              { text: 'Chúng tôi', order: 1 },
              { text: 'cần', order: 2 },
              { text: 'nhiều đĩa', order: 3 },
              { text: 'cho bữa tối', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự để tạo thành câu có nghĩa giống câu tiếng Việt:',
          meta: {
            question: 'Bạn có ăn nhiều thịt không?',
            options: [
              { text: 'Do you', order: 1 },
              { text: 'eat', order: 2 },
              { text: 'much', order: 3 },
              { text: 'meat?', order: 4 },
            ],
            correctOrder: [1, 2, 3, 4],
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

  console.log('✅ Created Level 2: Grammar learning with multiple choice exercises for Skill 2');

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
        skillId: skillId,
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
            sourceText: 'I eat rice for lunch.',
            correctAnswer: 'Tôi ăn cơm cho bữa trưa.',
            hints: ['rice = cơm', 'lunch = bữa trưa'],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng theo nghĩa tiếng Việt đã cho:',
          meta: {
            question: 'Tôi ăn thịt gà mỗi bữa tối.',
            options: [
              { text: 'I eat chicken every dinner.', order: 1 },
              { text: 'I am eating chicken every dinner.', order: -1 },
              { text: 'I ate chicken every dinner.', order: -1 },
              { text: 'I will eat chicken every dinner.', order: -1 },
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
                text: 'I eat ___ for dinner.',
                correctAnswer: 'chicken',
                options: ['chicken', 'soup', 'juice', 'water'],
              },
              {
                text: 'The soup is very ___.',
                correctAnswer: 'hot',
                options: ['hot', 'cold', 'fresh', 'sweet'],
              },
            ],
            context: 'Sử dụng từ vựng cơ bản về bữa tối.',
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to câu sau với phát âm chuẩn:',
          meta: {
            prompt: 'Phát âm câu: "I eat rice and eat soup"',
            expectedText: 'I eat rice and eat soup',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một đoạn văn ngắn mô tả bữa tối của bạn:',
          meta: {
            prompt: 'Describe your dinner. What do you eat and drink? Use at least 30 words.',
            minWords: 30,
            maxWords: 60,
            exampleAnswer: 'I eat rice and chicken for dinner. I like soup too. I have dinner at 7 PM. My dinner is very delicious and healthy.',
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
            sourceText: 'Tôi ăn hải sản vào bữa tối.',
            correctAnswer: 'I eat seafood for dinner.',
            hints: ['hải sản = seafood', 'bữa tối = dinner'],
          },
        },
        {
          exerciseType: ExerciseType.match,
          prompt: 'Nối các từ với định nghĩa phù hợp:',
          meta: {
            pairs: [
              { left: 'Fish', right: 'Cá' },
              { left: 'Beef', right: 'Thịt bò' },
              { left: 'Pork', right: 'Thịt lợn' },
              { left: 'Salad', right: 'Món rau trộn' },
              { left: 'Meal', right: 'Bữa ăn' },
            ],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ để tạo thành câu hoàn chỉnh:',
          meta: {
            question: 'Tôi muốn một ít thịt lợn vào bữa trưa.',
            options: [
              { text: 'I want', order: 1 },
              { text: 'some pork', order: 2 },
              { text: 'for lunch', order: 3 },
            ],
            correctOrder: [1, 2, 3],
          },
        },
        {
          exerciseType: ExerciseType.listen_choose,
          prompt: 'Nghe và chọn câu đúng:',
          meta: {
            correctAnswer: 'I want some salad.',
            options: [
              'I want some salad.',
              'I want some soup.',
              'I eat some salad.',
              'I eat some soup.',
            ],
            sentence: 'I want some salad.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Mô tả bữa trưa yêu thích của bạn:',
          meta: {
            prompt: 'Describe your favorite lunch. What do you like to eat and drink?',
            minWords: 40,
            maxWords: 80,
            exampleAnswer: 'My favorite lunch is rice and beef. I like to eat salad too. I drink water. This lunch is healthy and tasty. I eat lunch at home.',
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
            sourceText: 'She eats beef and eats salad.',
            correctAnswer: 'Cô ấy ăn thịt bò và ăn rau trộn.',
            hints: ['beef = thịt bò', 'salad = rau trộn'],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành đoạn văn với từ phù hợp:',
          meta: {
            sentences: [
              {
                text: 'Every evening, I ___ dinner at 7 PM.',
                correctAnswer: 'eat',
                options: ['eat', 'am eating', 'eating', 'eats'],
              },
              {
                text: 'Right now, my mom ___ soup in the kitchen.',
                correctAnswer: 'is cooking',
                options: ['cooks', 'is cooking', 'cook', 'cooking'],
              },
              {
                text: 'We always choose ___ vegetables for our meals.',
                correctAnswer: 'fresh',
                options: ['fresh', 'quick', 'hungry', 'delicious'],
              },
            ],
            context: 'Phân biệt thì hiện tại đơn và hiện tại tiếp diễn, sử dụng từ vựng phù hợp.',
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu có cấu trúc ngữ pháp đúng:',
          meta: {
            question: 'Câu nào diễn tả đúng ý: "Tôi thường ăn thịt gà, nhưng hôm nay tôi đang ăn cá"?',
            options: [
              { text: 'I usually eat chicken, but today I eat fish.', order: -1 },
              { text: 'I usually eat chicken, but today I am eating fish.', order: 1 },
              { text: 'I am usually eating chicken, but today I eat fish.', order: -1 },
              { text: 'I usually am eating chicken, but today I am eating fish.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to đoạn văn sau với phát âm và ngữ điệu tự nhiên:',
          meta: {
            prompt: 'Đọc: "Lunch is an important meal. I always eat rice, meat, and fresh vegetables."',
            expectedText: 'Lunch is an important meal. I always eat rice, meat, and fresh vegetables.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một bài luận ngắn về bữa ăn hàng ngày của bạn:',
          meta: {
            prompt: 'Write a short essay about your daily meals. Include your personal experiences and healthy choices. Use both present simple and present continuous tenses appropriately.',
            minWords: 120,
            maxWords: 200,
            exampleAnswer: 'Daily meals are essential for providing energy. I always eat a balanced lunch because it helps me work better. Traditional foods like rice and meat provide important nutrients. Currently, many people are choosing healthier options like fresh salad and fish. In my culture, we usually share dinner with family, which strengthens our relationships. I am learning that a good meal affects my entire day positively.',
            criteria: ['essay structure', 'grammar variety', 'vocabulary richness', 'cultural awareness'],
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

  console.log('✅ Created Level 3: Mixed practice with writing and translation for Skill 2');

  // Level 4: Listening Comprehension - Podcast with dialogue
  const level4Lessons = [
    {
      title: 'Dinner Conversation',
      description: 'Listen to a dialogue about dinner plans and food preferences',
    },
  ];

  for (let i = 0; i < level4Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skillId,
        skillLevel: 4,
        title: level4Lessons[i].title,
        position: i + 1,
      },
    });

    const exerciseData = [
      {
        exerciseType: ExerciseType.podcast,
        prompt: 'Nghe đoạn hội thoại giữa Sarah và Mark về kế hoạch ăn tối, sau đó trả lời các câu hỏi:',
        meta: {
          title: 'Dinner Conversation Between Sarah and Mark',
          description: 'A dialogue about dinner plans, cooking, and food preferences',
          showTranscript: true,
          media: { type: 'none', url: null, thumbnailUrl: null },
          segments: [
            {
              order: 1,
              transcript: `Hi Mark! What are you having for dinner tonight?`,
              voiceGender: 'female',
              questions: null,
            },
            {
              order: 2,
              transcript: `Hey Sarah! I'm planning to make a healthy meal. I'll cook some rice and grill a piece of chicken. What about you?`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'match',
                  question: 'Nối các từ tiếng Anh với nghĩa tiếng Việt:',
                  pairs: [
                    { left: 'Meal', right: 'Bữa ăn' },
                    { left: 'Rice', right: 'Cơm/Gạo' },
                    { left: 'Chicken', right: 'Thịt gà' },
                    { left: 'Dinner', right: 'Bữa tối' },
                  ],
                },
              ],
            },
            {
              order: 3,
              transcript: `That sounds delicious! I'm actually going to a seafood restaurant. I really love fish and salad.`,
              voiceGender: 'female',
              questions: [
                {
                  type: 'trueFalse',
                  statement: 'Sarah is cooking beef at home.',
                  correctAnswer: false,
                  explanation: 'Sarah sẽ đi nhà hàng hải sản (seafood restaurant) và cô ấy thích cá (fish) và rau trộn (salad).',
                },
              ],
            },
            {
              order: 4,
              transcript: `Seafood is great! But don't you think it's a bit expensive to eat out? I prefer cooking at home. I use lots of vegetables like potatoes, tomatoes, and onions.`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'listenChoose',
                  question: 'Chọn các loại rau củ bạn nghe được trong đoạn này:',
                  correctWords: ['vegetables', 'potatoes', 'tomatoes', 'onions'],
                  distractorWords: ['meat', 'chicken', 'fruit', 'salt'],
                },
              ],
            },
            {
              order: 5,
              transcript: `True, it can be expensive. But I don't have much time to cook. When I do cook, I usually just make a quick soup or boil some pork.`,
              voiceGender: 'female',
              questions: [
                {
                  type: 'multipleChoice',
                  question: 'What does Sarah usually make when she cooks?',
                  options: [
                    'Beef and rice',
                    'Soup or pork',
                    'Chicken and salad',
                    'Seafood',
                  ],
                  correctAnswer: 'Soup or pork',
                },
              ],
            },
            {
              order: 6,
              transcript: `Soup is always a good choice. Do you use a lot of salt and pepper when you cook?`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'trueFalse',
                  statement: 'Mark asks Sarah if she uses salt and pepper.',
                  correctAnswer: true,
                  explanation: 'Mark hỏi "Do you use a lot of salt and pepper when you cook?".',
                },
              ],
            },
            {
              order: 7,
              transcript: `Not too much salt, but I love pepper and garlic. They add so much flavor. Do you need any special sauce for your chicken tonight?`,
              voiceGender: 'female',
              questions: [
                {
                  type: 'match',
                  question: 'Nối các gia vị tiếng Anh với tiếng Việt:',
                  pairs: [
                    { left: 'Salt', right: 'Muối' },
                    { left: 'Pepper', right: 'Hạt tiêu' },
                    { left: 'Garlic', right: 'Tỏi' },
                    { left: 'Sauce', right: 'Nước xốt' },
                  ],
                },
              ],
            },
            {
              order: 8,
              transcript: `Yes, I have a special tomato sauce. By the way, I just bought some new plates and bowls. They look fantastic on the table.`,
              voiceGender: 'male',
              questions: [
                {
                  type: 'multipleChoice',
                  question: 'What did Mark buy recently?',
                  options: [
                    'Plates and bowls',
                    'Knives and forks',
                    'Pots and pans',
                    'Spoons',
                  ],
                  correctAnswer: 'Plates and bowls',
                },
              ],
            },
            {
              order: 9,
              transcript: `Nice! A good presentation makes the meal even better. Well, I have to go get ready for my dinner. Have a great evening!`,
              voiceGender: 'female',
              questions: null,
            },
            {
              order: 10,
              transcript: `You too! Enjoy your fish!`,
              voiceGender: 'male',
              questions: null,
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

  console.log('✅ Created Level 4: Podcast listening comprehension for Skill 2');

  // Level 5: Practice Review
  const level5Lessons = [
    {
      title: 'Basic Review & Practice',
      description: 'Review vocabulary and simple grammar',
    },
    {
      title: 'Simple Communication',
      description: 'Basic lunch and dinner conversations',
    },
    {
      title: 'Final Review',
      description: 'Complete practice with simple writing',
    },
  ];

  for (let i = 0; i < level5Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skillId,
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
            sourceText: 'We eat healthy food for dinner.',
            correctAnswer: 'Chúng tôi ăn thức ăn lành mạnh cho bữa tối.',
            hints: ['healthy = lành mạnh', 'food = thức ăn', 'dinner = bữa tối'],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng ngữ pháp:',
          meta: {
            question: 'Câu nào đúng?',
            options: [
              { text: 'They eat healthy dinner every day.', order: 1 },
              { text: 'They eating healthy dinner every day.', order: -1 },
              { text: 'They are eat healthy dinner every day.', order: -1 },
              { text: 'They eats healthy dinner every day.', order: -1 },
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
                text: 'The soup is very ___.',
                correctAnswer: 'hot',
                options: ['hot', 'cold', 'sweet', 'fresh'],
              },
              {
                text: 'I ___ dinner at home.',
                correctAnswer: 'eat',
                options: ['eat', 'drink', 'cook', 'make'],
              },
              {
                text: 'Fresh ___ is good for health.',
                correctAnswer: 'salad',
                options: ['salad', 'bread', 'coffee', 'milk'],
              },
            ],
            context: 'Sử dụng từ vựng cơ bản về bữa tối.',
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to câu sau:',
          meta: {
            prompt: 'Phát âm: "Dinner is important for good health"',
            expectedText: 'Dinner is important for good health',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về lợi ích của bữa tối:',
          meta: {
            prompt: 'Write about why dinner is good. Use simple sentences.',
            minWords: 40,
            maxWords: 80,
            exampleAnswer: 'Dinner is very important. It helps me relax after work. I eat healthy food like fish and vegetables. I drink water or juice. Dinner helps me sleep well.',
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
            sourceText: 'What do you usually eat for lunch? I eat rice and eat meat.',
            correctAnswer: 'Bạn thường ăn gì cho bữa trưa? Tôi ăn cơm và ăn thịt.',
            hints: ['usually = thường', 'lunch = bữa trưa'],
          },
        },
        {
          exerciseType: ExerciseType.match,
          prompt: 'Nối các từ với nghĩa tiếng Việt:',
          meta: {
            pairs: [
              { left: 'Lunch', right: 'Bữa trưa' },
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
            question: 'A: "Do you like dinner?" B: "___"',
            options: [
              { text: 'Yes, I like dinner very much.', order: 1 },
              { text: 'Yes, I am like dinner very much.', order: -1 },
              { text: 'Yes, I liking dinner very much.', order: -1 },
              { text: 'Yes, I likes dinner very much.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.listen_choose,
          prompt: 'Nghe và chọn câu đúng:',
          meta: {
            correctAnswer: 'I eat rice and chicken for lunch.',
            options: [
              'I eat rice and chicken for lunch.',
              'I eat bread and yogurt for lunch.',
              'I eat fruit and cheese for lunch.',
              'I eat meat and yogurt for lunch.',
            ],
            sentence: 'I eat rice and chicken for lunch.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một đoạn hội thoại về bữa tối:',
          meta: {
            prompt: 'Write a simple conversation between two people talking about dinner.',
            minWords: 50,
            maxWords: 100,
            exampleAnswer: 'A: What do you eat for dinner? B: I eat rice and chicken. What about you? A: I like beef and vegetables. B: That sounds good. Do you cook dinner? A: Yes, I cook beef every evening. B: I usually eat quick dinner because I am busy.',
            criteria: ['simple dialogue', 'basic vocabulary', 'natural conversation'],
          },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu về văn hóa ăn tối:',
          meta: {
            sourceText: 'In my country, people eat rice for dinner.',
            correctAnswer: 'Ở đất nước tôi, mọi người ăn cơm cho bữa tối.',
            hints: ['country = đất nước', 'people = mọi người', 'rice = cơm'],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành câu với từ vựng phù hợp:',
          meta: {
            sentences: [
              {
                text: 'Different countries have different ___ for dinner.',
                correctAnswer: 'foods',
                options: ['foods', 'drinks', 'ways', 'times'],
              },
              {
                text: 'In America, people often eat ___ for dinner.',
                correctAnswer: 'meat',
                options: ['meat', 'rice', 'soup', 'salad'],
              },
              {
                text: 'Dinner is ___ in every culture.',
                correctAnswer: 'important',
                options: ['important', 'difficult', 'expensive', 'quick'],
              },
            ],
            context: 'Sử dụng từ vựng về văn hóa ăn tối ở các nước khác nhau.',
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng về văn hóa ăn tối:',
          meta: {
            question: 'Câu nào nói về sự khác biệt văn hóa trong ăn tối?',
            options: [
              { text: 'People in different countries eat different dinner foods.', order: 1 },
              { text: 'All people in the world eat the same dinner.', order: -1 },
              { text: 'Only Americans eat dinner in the evening.', order: -1 },
              { text: 'Dinner is not important in any culture.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc câu về văn hóa ăn tối:',
          meta: {
            prompt: 'Đọc: "Dinner customs are different around the world"',
            expectedText: 'Dinner customs are different around the world',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về sự khác biệt văn hóa trong ăn tối:',
          meta: {
            prompt: 'Write about how dinner is different in different countries. Use simple sentences.',
            minWords: 50,
            maxWords: 100,
            exampleAnswer: 'People eat different foods for dinner around the world. In America, people eat meat and potatoes. In Japan, people eat rice and fish. In my country, we eat rice and soup. All cultures think dinner is important for family time.',
            criteria: ['simple sentences', 'cultural comparison', 'basic vocabulary'],
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

  console.log('✅ Created Level 5: Practice review with beginner-friendly exercises for Skill 2');

  // Level 6: Image Description & Writing
  const level6Lessons = [
    {
      title: 'Describing Dinner Foods',
      description: 'Look at pictures and describe dinner foods',
    },
    {
      title: 'People Eating Dinner',
      description: 'Describe what people are eating for dinner',
    },
    {
      title: 'Dinner Soup',
      description: 'Describe dinner soup and meals',
    },
  ];

  for (let i = 0; i < level6Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skillId,
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
              'https://images.unsplash.com/photo-1544025162-8315ea07525b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            prompt:
              'Describe what you see in this picture. What is the person eating?',
            expectedResults:
              'A person is eating chicken and rice. The meal looks delicious and healthy.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về thịt gà và cơm (chicken and rice):',
          meta: {
            prompt:
              'Write about chicken and rice. Do you like them? When do you eat them?',
            minWords: 30,
            maxWords: 60,
            exampleAnswer:
              'Chicken and rice is very delicious. I like to eat it for dinner. The chicken is soft and the rice is hot. My family likes chicken and rice too.',
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
              'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            prompt:
              'Describe what you see in this picture. What is the person eating?',
            expectedResults:
              'The person is eating a fresh salad. The salad has tomatoes and vegetables. It looks healthy.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về rau trộn (salad):',
          meta: {
            prompt:
              'Write about salad. Do you eat salad for dinner? What do you eat it with?',
            minWords: 30,
            maxWords: 60,
            exampleAnswer:
              'Salad is a healthy dinner. I eat salad with tomatoes and onions. It tastes good and fresh. Salad gives me energy. I eat salad every evening.',
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
              'https://images.unsplash.com/photo-1497534547324-0ebb3f052e88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            prompt:
              'Describe what you see in this picture. What is the person eating?',
            expectedResults:
              'The person is eating hot soup. The soup looks fresh and delicious. There is a spoon in the bowl.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về món súp (soup):',
          meta: {
            prompt:
              'Write about soup. What do you like to put in your soup?',
            minWords: 30,
            maxWords: 60,
            exampleAnswer:
              'I like to eat hot soup for dinner. It is fresh and delicious. I put vegetables and meat in my soup. Soup is an important meal in my family.',
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

  console.log('✅ Created Level 6: Image description & writing exercises for Skill 2');

  // Level 7: Final Assessment
  const level7Lessons = [
    {
      title: 'Final Knowledge Assessment',
      description:
        'Test all knowledge learned about lunch and dinner vocabulary and grammar',
    },
  ];

  for (let i = 0; i < level7Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        skillId: skillId,
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
            { left: 'Dinner', right: 'Bữa ăn tối' },
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
            { text: 'I eat dinner every day.', order: -1 },
            { text: 'I am eating dinner right now.', order: 1 },
            { text: 'I eating dinner now.', order: -1 },
            { text: 'I eats dinner now.', order: -1 },
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
              text: 'Every evening, I ___ a healthy dinner.',
              correctAnswer: 'eat',
              options: ['eat', 'eating', 'am eating', 'eats'],
            },
            {
              text: 'Right now, my mother ___ soup in the kitchen.',
              correctAnswer: 'is cooking',
              options: ['cook', 'cooks', 'is cooking', 'cooking'],
            },
            {
              text: 'Chicken with ___ sauce tastes very good.',
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
            'My family usually eats chicken and drinks water for dinner, but today we are having seafood.',
          correctAnswer:
            'Gia đình tôi thường ăn thịt gà và uống nước cho bữa tối, nhưng hôm nay chúng tôi đang ăn hải sản.',
          hints: [
            'usually = thường',
            'water = nước',
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
            'Đọc: "I love eating healthy dinner with fresh salad, delicious chicken, and hot soup every evening"',
          expectedText:
            'I love eating healthy dinner with fresh salad, delicious chicken, and hot soup every evening',
        },
      },
      {
        exerciseType: ExerciseType.listen_choose,
        prompt: 'Nghe và chọn câu đúng:',
        meta: {
          correctAnswer: 'She always cooks beef and vegetables for dinner.',
          options: [
            'She always cooks beef and vegetables for dinner.',
            'She always eats beef and vegetables for dinner.',
            'She always drinks beef and vegetables for dinner.',
            'She always makes beef and vegetables for dinner.',
          ],
          sentence: 'She always cooks beef and vegetables for dinner.',
        },
      },
      {
        exerciseType: ExerciseType.image_description,
        prompt: 'Mô tả toàn diện những gì bạn thấy:',
        meta: {
          imageUrl:
            'https://images.unsplash.com/photo-1544025162-8315ea07525b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          prompt:
            'Describe everything you see in this dinner scene using the vocabulary you have learned.',
          expectedResults:
            'A person is eating delicious chicken and rice for dinner. They look happy and hungry. The food is fresh and hot. This is a healthy dinner.',
        },
      },
      {
        exerciseType: ExerciseType.writing_prompt,
        prompt: 'Viết bài tổng hợp toàn bộ kiến thức đã học:',
        meta: {
          prompt:
            'Write about your perfect dinner. Use vocabulary words, present simple and present continuous tense. Describe what you usually eat and what you are eating today.',
          minWords: 80,
          maxWords: 120,
          exampleAnswer:
            'My perfect dinner is very healthy and delicious. I usually eat fresh salad, beef, and drink hot soup every evening. The salad is fresh and the beef gives me energy. Today I am eating something special - seafood! My mother is cooking fish and vegetables in the kitchen right now. We always enjoy our dinner together. Dinner is an important meal because it helps me relax after a long day of work.',
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

  console.log('✅ Created Level 7: Final comprehensive assessment for Skill 2');

  return { createdWords, createdGrammars };
}
