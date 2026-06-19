import { PrismaClient, Word, Grammar, ExerciseType } from '@prisma/client';

export async function seedSkill3(prisma: PrismaClient, skillId: string, tagId: string) {
  console.log('🌱 Seeding Skill 3: Restaurant English...');

  const sampleWords = [
    { content: 'Restaurant', pronunciation: 'ˈrestrɒnt', meaning: 'Nhà hàng', audioUrl: 'example' },
    { content: 'Menu', pronunciation: 'ˈmenjuː', meaning: 'Thực đơn', audioUrl: 'example' },
    { content: 'Waiter', pronunciation: 'ˈweɪtə', meaning: 'Bồi bàn nam', audioUrl: 'example' },
    { content: 'Waitress', pronunciation: 'ˈweɪtrəs', meaning: 'Bồi bàn nữ', audioUrl: 'example' },
    { content: 'Order', pronunciation: 'ˈɔːdə', meaning: 'Gọi món', audioUrl: 'example' },
    { content: 'Bill', pronunciation: 'bɪl', meaning: 'Hóa đơn', audioUrl: 'example' },
    { content: 'Tip', pronunciation: 'tɪp', meaning: 'Tiền boa', audioUrl: 'example' },
    { content: 'Chef', pronunciation: 'ʃef', meaning: 'Đầu bếp', audioUrl: 'example' },
    { content: 'Table', pronunciation: 'ˈteɪbl', meaning: 'Bàn', audioUrl: 'example' },
    { content: 'Reservation', pronunciation: 'ˌrezəˈveɪʃn', meaning: 'Sự đặt trước', audioUrl: 'example' },
    { content: 'Appetizer', pronunciation: 'ˈæpɪtaɪzə', meaning: 'Món khai vị', audioUrl: 'example' },
    { content: 'Course', pronunciation: 'kɔːs', meaning: 'Món ăn (trong bữa ăn)', audioUrl: 'example' },
    { content: 'Dessert', pronunciation: 'dɪˈzɜːt', meaning: 'Món tráng miệng', audioUrl: 'example' },
    { content: 'Beverage', pronunciation: 'ˈbevərɪdʒ', meaning: 'Đồ uống', audioUrl: 'example' },
    { content: 'Delicious', pronunciation: 'dɪˈlɪʃəs', meaning: 'Ngon', audioUrl: 'example' },
    { content: 'Spicy', pronunciation: 'ˈspaɪsi', meaning: 'Cay', audioUrl: 'example' },
    { content: 'Sweet', pronunciation: 'swiːt', meaning: 'Ngọt', audioUrl: 'example' },
    { content: 'Sour', pronunciation: 'ˈsaʊə', meaning: 'Chua', audioUrl: 'example' },
    { content: 'Bitter', pronunciation: 'ˈbɪtə', meaning: 'Đắng', audioUrl: 'example' },
    { content: 'Salty', pronunciation: 'ˈsɔːlti', meaning: 'Mặn', audioUrl: 'example' },
    { content: 'Fresh', pronunciation: 'freʃ', meaning: 'Tươi', audioUrl: 'example' },
    { content: 'Serve', pronunciation: 'sɜːv', meaning: 'Phục vụ', audioUrl: 'example' },
    { content: 'Recommend', pronunciation: 'ˌrekəˈmend', meaning: 'Gợi ý', audioUrl: 'example' },
    { content: 'Pay', pronunciation: 'peɪ', meaning: 'Thanh toán', audioUrl: 'example' },
    { content: 'Receipt', pronunciation: 'rɪˈsiːt', meaning: 'Biên lai', audioUrl: 'example' },
  ];

  const createdWords: Word[] = [];
  for (const wordData of sampleWords) {
    let word = await prisma.word.findUnique({ where: { content: wordData.content } });
    if (!word) {
      word = await prisma.word.create({ data: wordData });
      await prisma.wordTag.create({ data: { wordId: word.id, tagId: tagId } });
    }
    createdWords.push(word);
  }
  console.log(`✅ Processed ${createdWords.length} words for Skill 3`);

  const grammarRules = [
    {
      rule: 'Polite Requests (I would like / Could I have)',
      explanation: 'Dùng để yêu cầu món ăn hoặc dịch vụ một cách lịch sự trong nhà hàng.',
      examples: [
        'I would like the steak, please.',
        'Could I have the menu?',
        'We would like a table for two.',
        'May I have the bill, please?',
      ],
    },
    {
      rule: 'Asking for Recommendations',
      explanation: 'Dùng để hỏi xin gợi ý món ăn từ nhân viên nhà hàng.',
      examples: [
        'What do you recommend?',
        'What is today\'s special?',
        'Do you have any vegetarian dishes?',
        'How spicy is this dish?',
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
  console.log(`✅ Created ${createdGrammars.length} grammar rules for Skill 3`);

  for (let i = 0; i < createdWords.length; i++) {
    await prisma.skillWord.create({ data: { skillId: skillId, wordId: createdWords[i].id } });
  }
  for (const grammar of createdGrammars) {
    await prisma.skillGrammar.create({ data: { skillId: skillId, grammarId: grammar.id } });
  }

  for (let level = 1; level <= 7; level++) {
    await prisma.skillLevel.create({ data: { skillId: skillId, level: level } });
  }
  console.log('✅ Created 7 skill levels for Skill 3');

  // Level 1: New word learning
  const level1Lessons = [
    { title: 'Restaurant Basics 1', words: createdWords.slice(0, 5) },
    { title: 'Restaurant Basics 2', words: createdWords.slice(5, 10) },
    { title: 'Restaurant Basics 3', words: createdWords.slice(10, 15) },
    { title: 'Restaurant Basics 4', words: createdWords.slice(15, 20) },
    { title: 'Restaurant Basics 5', words: createdWords.slice(20, 25) },
  ];

  const exerciseDataLesson1 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Restaurant', right: 'Nhà hàng' },
          { left: 'Menu', right: 'Thực đơn' },
          { left: 'Waiter', right: 'Bồi bàn nam' },
          { left: 'Waitress', right: 'Bồi bàn nữ' },
          { left: 'Order', right: 'Gọi món' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Chọn đáp án đúng: "Menu" có nghĩa là gì?',
      meta: {
        question: 'Menu có nghĩa là gì?',
        options: [
          { text: 'Thực đơn', order: 1 },
          { text: 'Hóa đơn', order: -1 },
          { text: 'Gọi món', order: -1 },
          { text: 'Nhà hàng', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Order',
        options: ['Waiter', 'Order', 'Menu', 'Waitress'],
        sentence: 'Order',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "Can I see the __, please?" (Cho tôi xem thực đơn được không?)',
      meta: {
        sentences: [{ text: 'Can I see the ___, please?', correctAnswer: 'menu', options: ['menu', 'order', 'waiter', 'restaurant'] }],
        context: 'Điền từ vựng liên quan đến đặt món.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Restaurant" theo âm thanh mẫu.',
      meta: { prompt: 'Phát âm từ "Restaurant" (ˈrestrɒnt)', expectedText: 'Restaurant' },
    },
  ];

  const exerciseDataLesson2 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Bill', right: 'Hóa đơn' },
          { left: 'Tip', right: 'Tiền boa' },
          { left: 'Chef', right: 'Đầu bếp' },
          { left: 'Table', right: 'Bàn' },
          { left: 'Reservation', right: 'Sự đặt trước' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Hóa đơn"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Hóa đơn"?',
        options: [
          { text: 'Tip', order: -1 },
          { text: 'Menu', order: -1 },
          { text: 'Bill', order: 1 },
          { text: 'Receipt', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Reservation',
        options: ['Table', 'Bill', 'Chef', 'Reservation'],
        sentence: 'Reservation',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "I have a __ for two people." (Tôi có một sự đặt trước cho hai người.)',
      meta: {
        sentences: [{ text: 'I have a ___ for two people.', correctAnswer: 'reservation', options: ['reservation', 'table', 'bill', 'tip'] }],
        context: 'Điền từ vựng liên quan đến bàn ăn.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Chef" theo âm thanh mẫu.',
      meta: { prompt: 'Phát âm từ "Chef" (ʃef)', expectedText: 'Chef' },
    },
  ];

  const exerciseDataLesson3 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Appetizer', right: 'Món khai vị' },
          { left: 'Course', right: 'Món ăn (trong bữa ăn)' },
          { left: 'Dessert', right: 'Món tráng miệng' },
          { left: 'Beverage', right: 'Đồ uống' },
          { left: 'Delicious', right: 'Ngon' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Món tráng miệng"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Món tráng miệng"?',
        options: [
          { text: 'Appetizer', order: -1 },
          { text: 'Beverage', order: -1 },
          { text: 'Dessert', order: 1 },
          { text: 'Course', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Delicious',
        options: ['Delicious', 'Appetizer', 'Dessert', 'Beverage'],
        sentence: 'Delicious',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "Would you like a __?" (Bạn có muốn dùng đồ uống không?)',
      meta: {
        sentences: [{ text: 'Would you like a ___?', correctAnswer: 'beverage', options: ['beverage', 'dessert', 'course', 'appetizer'] }],
        context: 'Điền loại thức ăn/đồ uống.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Appetizer" theo âm thanh mẫu.',
      meta: { prompt: 'Phát âm từ "Appetizer" (ˈæpɪtaɪzə)', expectedText: 'Appetizer' },
    },
  ];

  const exerciseDataLesson4 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Spicy', right: 'Cay' },
          { left: 'Sweet', right: 'Ngọt' },
          { left: 'Sour', right: 'Chua' },
          { left: 'Bitter', right: 'Đắng' },
          { left: 'Salty', right: 'Mặn' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Cay"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Cay"?',
        options: [
          { text: 'Sweet', order: -1 },
          { text: 'Salty', order: -1 },
          { text: 'Spicy', order: 1 },
          { text: 'Sour', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Sweet',
        options: ['Bitter', 'Salty', 'Sweet', 'Spicy'],
        sentence: 'Sweet',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "This soup is too __." (Món súp này quá mặn.)',
      meta: {
        sentences: [{ text: 'This soup is too ___.', correctAnswer: 'salty', options: ['salty', 'sweet', 'bitter', 'spicy'] }],
        context: 'Điền vị của thức ăn.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Spicy" theo âm thanh mẫu.',
      meta: { prompt: 'Phát âm từ "Spicy" (ˈspaɪsi)', expectedText: 'Spicy' },
    },
  ];

  const exerciseDataLesson5 = [
    {
      exerciseType: ExerciseType.match,
      prompt: 'Nối từ tiếng Anh với nghĩa tiếng Việt tương ứng.',
      meta: {
        pairs: [
          { left: 'Fresh', right: 'Tươi' },
          { left: 'Serve', right: 'Phục vụ' },
          { left: 'Recommend', right: 'Gợi ý' },
          { left: 'Pay', right: 'Thanh toán' },
          { left: 'Receipt', right: 'Biên lai' },
        ],
      },
    },
    {
      exerciseType: ExerciseType.multiple_choice,
      prompt: 'Từ nào sau đây có nghĩa là "Thanh toán"?',
      meta: {
        question: 'Từ nào sau đây có nghĩa là "Thanh toán"?',
        options: [
          { text: 'Serve', order: -1 },
          { text: 'Recommend', order: -1 },
          { text: 'Pay', order: 1 },
          { text: 'Receipt', order: -1 },
        ],
        correctOrder: [1],
      },
    },
    {
      exerciseType: ExerciseType.listen_choose,
      prompt: 'Nghe và chọn từ mà bạn nghe được.',
      meta: {
        correctAnswer: 'Recommend',
        options: ['Serve', 'Pay', 'Fresh', 'Recommend'],
        sentence: 'Recommend',
      },
    },
    {
      exerciseType: ExerciseType.fill_blank,
      prompt: 'Hoàn thành câu: "Can I have the __?" (Cho tôi xin biên lai được không?)',
      meta: {
        sentences: [{ text: 'Can I have the ___?', correctAnswer: 'receipt', options: ['receipt', 'bill', 'menu', 'order'] }],
        context: 'Điền từ vựng thanh toán.',
      },
    },
    {
      exerciseType: ExerciseType.speak,
      prompt: 'Hãy phát âm từ "Serve" theo âm thanh mẫu.',
      meta: { prompt: 'Phát âm từ "Serve" (sɜːv)', expectedText: 'Serve' },
    },
  ];

  const level1ExerciseData: any[] = [
    exerciseDataLesson1, exerciseDataLesson2, exerciseDataLesson3, exerciseDataLesson4, exerciseDataLesson5,
  ];

  for (let i = 0; i < level1Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: { skillId: skillId, skillLevel: 1, title: level1Lessons[i].title, position: i + 1 },
    });

    const exerciseData = level1ExerciseData[i];
    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: { lessonId: lesson.id, exerciseType: exerciseData[j].exerciseType, prompt: exerciseData[j].prompt, meta: exerciseData[j].meta, position: j + 1 },
      });
      for (const word of level1Lessons[i].words) {
        await prisma.exerciseWord.create({ data: { exerciseId: exercise.id, wordId: word.id } });
      }
    }
  }
  console.log('✅ Created Level 1: New word learning for Skill 3');

  // Level 2: Grammar
  const level2Lessons = [
    { title: 'Polite Requests', grammarRule: createdGrammars[0] },
    { title: 'Asking for Recommendations', grammarRule: createdGrammars[1] },
    { title: 'Mixed Grammar Practice', grammarRule: null },
  ];

  for (let i = 0; i < level2Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: { skillId: skillId, skillLevel: 2, title: level2Lessons[i].title, position: i + 1 },
    });

    let exerciseData: any[] = [];
    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự:',
          meta: {
            question: 'Tôi muốn gọi món bít tết.',
            options: [ { text: 'I', order: 1 }, { text: 'would like', order: 2 }, { text: 'the steak,', order: 3 }, { text: 'please.', order: 4 } ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự:',
          meta: {
            question: 'Cho tôi xin thực đơn được không?',
            options: [ { text: 'Could I', order: 1 }, { text: 'have', order: 2 }, { text: 'the menu,', order: 3 }, { text: 'please?', order: 4 } ],
            correctOrder: [1, 2, 3, 4],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự:',
          meta: {
            question: 'Chúng tôi muốn một bàn cho hai người.',
            options: [ { text: 'We', order: 1 }, { text: 'would like', order: 2 }, { text: 'a table', order: 3 }, { text: 'for two.', order: 4 } ],
            correctOrder: [1, 2, 3, 4],
          },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự:',
          meta: {
            question: 'Bạn có gợi ý món gì không?',
            options: [ { text: 'What', order: 1 }, { text: 'do you', order: 2 }, { text: 'recommend?', order: 3 } ],
            correctOrder: [1, 2, 3],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự:',
          meta: {
            question: 'Món đặc biệt hôm nay là gì?',
            options: [ { text: 'What is', order: 1 }, { text: 'today\'s', order: 2 }, { text: 'special?', order: 3 } ],
            correctOrder: [1, 2, 3],
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Sắp xếp các từ tiếng Anh theo đúng thứ tự:',
          meta: {
            question: 'Bạn có món chay nào không?',
            options: [ { text: 'Do you', order: 1 }, { text: 'have any', order: 2 }, { text: 'vegetarian', order: 3 }, { text: 'dishes?', order: 4 } ],
            correctOrder: [1, 2, 3, 4],
          },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng ngữ pháp:',
          meta: {
            question: 'Câu nào sử dụng lời yêu cầu đúng cách?',
            options: [
              { text: 'I want the bill now.', order: -1 },
              { text: 'Give me the menu.', order: -1 },
              { text: 'Could I have the bill, please?', order: 1 },
              { text: 'I taking the steak.', order: -1 },
            ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành câu: "__ do you recommend?"',
          meta: {
            sentences: [{ text: '___ do you recommend?', correctAnswer: 'What', options: ['What', 'How', 'Where', 'When'] }],
            context: 'Hỏi xin gợi ý món ăn.',
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to câu yêu cầu lịch sự:',
          meta: { prompt: 'Đọc: "Could I have the menu, please?"', expectedText: 'Could I have the menu, please' },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      const exercise = await prisma.exercise.create({
        data: { lessonId: lesson.id, exerciseType: exerciseData[j].exerciseType, prompt: exerciseData[j].prompt, meta: exerciseData[j].meta, position: j + 1 },
      });
      if (level2Lessons[i].grammarRule) {
        await prisma.exerciseGrammar.create({ data: { exerciseId: exercise.id, grammarId: level2Lessons[i].grammarRule!.id } });
      }
    }
  }
  console.log('✅ Created Level 2: Grammar learning for Skill 3');

  // Level 3: Mixed Practice (Writing and Translation)
  const level3Lessons = [
    { title: 'Ordering Food Translation', description: 'Practice translating sentences about ordering food.' },
    { title: 'Restaurant Review Writing', description: 'Write short reviews about food and service.' },
    { title: 'Restaurant Dialogue', description: 'Complete a conversation at a restaurant.' },
  ];

  for (let i = 0; i < level3Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: { skillId: skillId, skillLevel: 3, title: level3Lessons[i].title, position: i + 1 },
    });

    let exerciseData: any[] = [];
    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu sau sang tiếng Việt:',
          meta: { sourceText: 'I would like to order the steak and a glass of wine.', correctAnswer: 'Tôi muốn gọi món bít tết và một ly rượu vang.', hints: ['order = gọi món', 'glass of wine = ly rượu vang'] },
        },
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu sau sang tiếng Việt:',
          meta: { sourceText: 'Could I have the bill, please?', correctAnswer: 'Cho tôi xin hóa đơn được không?', hints: ['bill = hóa đơn'] },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu dịch đúng nhất:',
          meta: {
            question: 'What do you recommend for the main course?',
            options: [ { text: 'Bạn gợi ý món chính nào?', order: 1 }, { text: 'Bạn thích món khai vị nào?', order: -1 }, { text: 'Món tráng miệng nào ngon?', order: -1 } ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Điền từ còn thiếu:',
          meta: { sentences: [{ text: 'We have a ___ for two at 7 PM.', correctAnswer: 'reservation', options: ['reservation', 'menu', 'table'] }], context: 'Sự đặt trước' },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to câu sau:',
          meta: { prompt: 'Phát âm: "I would like to order the steak."', expectedText: 'I would like to order the steak' },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch đánh giá sau:',
          meta: { sourceText: 'The food was delicious but the service was slow.', correctAnswer: 'Thức ăn rất ngon nhưng phục vụ hơi chậm.', hints: ['delicious = ngon', 'service = phục vụ'] },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn từ phù hợp:',
          meta: {
            question: 'The soup was too ___ (mặn).',
            options: [ { text: 'sweet', order: -1 }, { text: 'salty', order: 1 }, { text: 'sour', order: -1 } ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một đánh giá ngắn về nhà hàng (3-5 câu):',
          meta: { prompt: 'Write a short review about a restaurant you visited recently.', minWords: 20, maxWords: 60, exampleAnswer: 'I visited a new restaurant yesterday. The food was very delicious. I ordered the chicken and it was not spicy. The waiter was very friendly. I will come back again.', criteria: ['simple sentences', 'restaurant vocabulary'] },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu trả lời đúng của bồi bàn:',
          meta: {
            question: 'Customer: "Are you ready to order?" Waiter: "___"',
            options: [ { text: 'Yes, I would like the fish.', order: -1 }, { text: 'Wait, I am the waiter. You are the customer.', order: 1 } ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một đoạn hội thoại ngắn giữa bạn và bồi bàn:',
          meta: { prompt: 'Write a short dialogue ordering food at a restaurant.', minWords: 30, maxWords: 80, exampleAnswer: 'Waiter: Are you ready to order? Me: Yes, I would like the beef steak. Waiter: How would you like your steak? Me: Medium rare, please. Waiter: And to drink? Me: Just water, thank you.', criteria: ['dialogue format', 'ordering vocabulary'] },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      await prisma.exercise.create({
        data: { lessonId: lesson.id, exerciseType: exerciseData[j].exerciseType, prompt: exerciseData[j].prompt, meta: exerciseData[j].meta, position: j + 1 },
      });
    }
  }
  console.log('✅ Created Level 3: Mixed practice for Skill 3');

  // Level 4: Podcast Listening Comprehension
  const level4Lessons = [{ title: 'Dining Out Podcast', description: 'Listen to a podcast about a restaurant experience.' }];

  for (let i = 0; i < level4Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: { skillId: skillId, skillLevel: 4, title: level4Lessons[i].title, position: i + 1 },
    });

    const exerciseData = [
      {
        exerciseType: ExerciseType.podcast,
        prompt: 'Nghe đoạn hội thoại tại nhà hàng, sau đó trả lời các câu hỏi:',
        meta: {
          title: 'Dining Out Podcast',
          description: 'A conversation between a customer and a waiter at a restaurant.',
          showTranscript: true,
          media: { type: 'none', url: null, thumbnailUrl: null },
          segments: [
            {
              order: 1,
              transcript: 'Welcome! Do you have a reservation?',
              voiceGender: 'male',
              questions: null,
            },
            {
              order: 2,
              transcript: 'Yes, for two under the name Smith.',
              voiceGender: 'female',
              questions: [
                {
                  type: 'match',
                  question: 'Nối các từ với nghĩa đúng:',
                  pairs: [
                    { left: 'Recommendation', right: 'Sự gợi ý' },
                    { left: 'Spicy', right: 'Cay' },
                    { left: 'Dessert', right: 'Món tráng miệng' },
                    { left: 'Bill', right: 'Hóa đơn' },
                  ],
                },
                {
                  type: 'multiple_choice',
                  question: 'What did the customer have?',
                  options: [
                    { text: 'A menu', order: -1 },
                    { text: 'A reservation', order: 1 },
                    { text: 'A bill', order: -1 },
                  ],
                  correctOrder: [1],
                },
              ],
            },
            {
              order: 3,
              transcript: 'I highly recommend the spicy seafood soup. It is our chef\'s special.',
              voiceGender: 'male',
              questions: [
                {
                  type: 'multiple_choice',
                  question: 'The waiter recommends a sweet dessert. True or False?',
                  options: [
                    { text: 'True', order: -1 },
                    { text: 'False', order: 1 },
                  ],
                  correctOrder: [1],
                },
              ],
            },
            {
              order: 4,
              transcript: 'I would like to order the spicy seafood soup.',
              voiceGender: 'female',
              questions: [
                {
                  type: 'multiple_choice',
                  question: 'Nghe và chọn câu đúng:',
                  options: [
                    { text: 'I would like to order the sweet seafood soup.', order: -1 },
                    { text: 'I would like to order the spicy seafood soup.', order: 1 },
                    { text: 'I would like to order the spicy chicken soup.', order: -1 },
                  ],
                  correctOrder: [1],
                },
              ],
            },
          ],
        },
      },
    ];

    for (let j = 0; j < exerciseData.length; j++) {
      await prisma.exercise.create({
        data: { lessonId: lesson.id, exerciseType: exerciseData[j].exerciseType, prompt: exerciseData[j].prompt, meta: exerciseData[j].meta, position: j + 1 },
      });
    }
  }
  console.log('✅ Created Level 4: Podcast listening comprehension for Skill 3');

  // Level 5: Practice Review
  const level5Lessons = [
    { title: 'Restaurant Basics Review', description: 'Review vocabulary and polite requests' },
    { title: 'Ordering Review', description: 'Basic ordering conversations' },
    { title: 'Final Review', description: 'Complete practice with simple writing' },
  ];

  for (let i = 0; i < level5Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: { skillId: skillId, skillLevel: 5, title: level5Lessons[i].title, position: i + 1 },
    });

    let exerciseData: any[] = [];
    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu đơn giản sau:',
          meta: { sourceText: 'I would like the menu, please.', correctAnswer: 'Làm ơn cho tôi xem thực đơn.', hints: ['menu = thực đơn'] },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng ngữ pháp:',
          meta: {
            question: 'Câu nào đúng?',
            options: [ { text: 'Could I have the bill?', order: 1 }, { text: 'Could I having the bill?', order: -1 }, { text: 'Could I has the bill?', order: -1 } ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành câu với từ vựng cơ bản:',
          meta: {
            sentences: [
              { text: 'The ___ is very friendly.', correctAnswer: 'waiter', options: ['waiter', 'menu', 'bill', 'receipt'] },
            ],
            context: 'Sử dụng từ vựng về nhân viên.',
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc to câu sau:',
          meta: { prompt: 'Phát âm: "The food is delicious."', expectedText: 'The food is delicious' },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về nhà hàng yêu thích của bạn:',
          meta: { prompt: 'Write about your favorite restaurant. Use simple sentences.', minWords: 30, maxWords: 60, exampleAnswer: 'My favorite restaurant is very nice. The food is delicious. I like the spicy soup. The waiter is friendly. I often go there with my family.', criteria: ['simple sentences', 'basic vocabulary'] },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch đoạn hội thoại đơn giản:',
          meta: { sourceText: 'Are you ready to order? Yes, I would like the fish.', correctAnswer: 'Bạn đã sẵn sàng gọi món chưa? Vâng, tôi muốn gọi món cá.', hints: ['ready = sẵn sàng', 'order = gọi món'] },
        },
        {
          exerciseType: ExerciseType.match,
          prompt: 'Nối các từ với nghĩa tiếng Việt:',
          meta: { pairs: [ { left: 'Serve', right: 'Phục vụ' }, { left: 'Pay', right: 'Thanh toán' }, { left: 'Receipt', right: 'Biên lai' }, { left: 'Tip', right: 'Tiền boa' } ] },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu trả lời đúng trong hội thoại:',
          meta: {
            question: 'Waiter: "Would you like a dessert?" You: "___"',
            options: [ { text: 'Yes, I would like the cake.', order: 1 }, { text: 'Yes, I would like the bill.', order: -1 }, { text: 'Yes, I am a dessert.', order: -1 } ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.listen_choose,
          prompt: 'Nghe và chọn câu đúng:',
          meta: {
            correctAnswer: 'I would like to pay the bill.',
            options: [ 'I would like to pay the bill.', 'I would like to pay the tip.', 'I would like to pay the menu.' ],
            sentence: 'I would like to pay the bill.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết một đoạn hội thoại thanh toán:',
          meta: { prompt: 'Write a simple conversation about paying the bill.', minWords: 30, maxWords: 60, exampleAnswer: 'Me: Could I have the bill, please? Waiter: Here you are. That is 50 dollars. Me: Here is my card. Waiter: Thank you. Here is your receipt. Me: Thank you. Keep the change as a tip.', criteria: ['simple dialogue', 'paying vocabulary'] },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.translate,
          prompt: 'Dịch câu về văn hóa ăn uống:',
          meta: { sourceText: 'In my country, we always leave a tip for the waiter.', correctAnswer: 'Ở nước tôi, chúng tôi luôn để lại tiền boa cho bồi bàn.', hints: ['leave = để lại', 'tip = tiền boa'] },
        },
        {
          exerciseType: ExerciseType.fill_blank,
          prompt: 'Hoàn thành câu với từ vựng phù hợp:',
          meta: {
            sentences: [
              { text: 'Different restaurants have different ___ on the menu.', correctAnswer: 'dishes', options: ['dishes', 'tables', 'waiters', 'receipts'] },
            ],
            context: 'Sử dụng từ vựng về thức ăn.',
          },
        },
        {
          exerciseType: ExerciseType.multiple_choice,
          prompt: 'Chọn câu đúng về văn hóa nhà hàng:',
          meta: {
            question: 'Câu nào nói đúng về việc thanh toán?',
            options: [ { text: 'You ask for the bill after you finish eating.', order: 1 }, { text: 'You eat the bill.', order: -1 }, { text: 'The waiter pays you.', order: -1 } ],
            correctOrder: [1],
          },
        },
        {
          exerciseType: ExerciseType.speak,
          prompt: 'Đọc câu về trải nghiệm ăn uống:',
          meta: { prompt: 'Đọc: "Dining out is a great way to celebrate special occasions."', expectedText: 'Dining out is a great way to celebrate special occasions' },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về văn hóa đi ăn nhà hàng ở nước bạn:',
          meta: { prompt: 'Write about going to a restaurant in your country. Use simple sentences.', minWords: 40, maxWords: 80, exampleAnswer: 'In my country, we love going to restaurants on weekends. We usually order a lot of food and share it. The service is very fast. We always leave a tip if the service is good. Eating out is fun.', criteria: ['simple sentences', 'cultural comparison'] },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      await prisma.exercise.create({
        data: { lessonId: lesson.id, exerciseType: exerciseData[j].exerciseType, prompt: exerciseData[j].prompt, meta: exerciseData[j].meta, position: j + 1 },
      });
    }
  }
  console.log('✅ Created Level 5: Practice review for Skill 3');

  // Level 6: Image Description & Writing
  const level6Lessons = [
    { title: 'Describing a Restaurant Scene', description: 'Look at a picture and describe the restaurant' },
    { title: 'Describing Food', description: 'Describe delicious meals' },
    { title: 'Paying the Bill', description: 'Describe the payment process' },
  ];

  for (let i = 0; i < level6Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: { skillId: skillId, skillLevel: 6, title: level6Lessons[i].title, position: i + 1 },
    });

    let exerciseData: any[] = [];
    if (i === 0) {
      exerciseData = [
        {
          exerciseType: ExerciseType.image_description,
          prompt: 'Nhìn vào hình ảnh và mô tả:',
          meta: {
            imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            prompt: 'Describe what you see in this restaurant picture.',
            expectedResults: 'I see a busy restaurant. There are many tables and chairs. People are eating and talking. The lighting is warm and beautiful.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về không gian nhà hàng (Restaurant atmosphere):',
          meta: { prompt: 'Write about what makes a good restaurant atmosphere.', minWords: 30, maxWords: 60, exampleAnswer: 'A good restaurant has a nice atmosphere. The music should be soft. The tables should be clean. The lighting makes people feel relaxed. I like restaurants with a nice view.', criteria: ['simple sentences', 'description'] },
        },
      ];
    } else if (i === 1) {
      exerciseData = [
        {
          exerciseType: ExerciseType.image_description,
          prompt: 'Nhìn vào hình ảnh và mô tả:',
          meta: {
            imageUrl: 'https://images.unsplash.com/photo-1544025162-8315ea07525b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            prompt: 'Describe this delicious food.',
            expectedResults: 'This is a plate of healthy food. I can see chicken and rice. It looks very fresh and delicious.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về món ăn bạn muốn thử:',
          meta: { prompt: 'Write about a delicious dish you want to try.', minWords: 30, maxWords: 60, exampleAnswer: 'I want to try a spicy seafood dish. I love shrimp and fish. I want it to be very spicy and sour. I will order it with a cold beverage.', criteria: ['food vocabulary', 'adjectives'] },
        },
      ];
    } else {
      exerciseData = [
        {
          exerciseType: ExerciseType.image_description,
          prompt: 'Nhìn vào hình ảnh và mô tả:',
          meta: {
            imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            prompt: 'Describe the payment process shown.',
            expectedResults: 'A person is paying the bill with a credit card. They are at the restaurant counter. They will receive a receipt.',
          },
        },
        {
          exerciseType: ExerciseType.writing_prompt,
          prompt: 'Viết về việc thanh toán tại nhà hàng:',
          meta: { prompt: 'Write about how you usually pay at a restaurant.', minWords: 30, maxWords: 60, exampleAnswer: 'I usually ask the waiter for the bill. I check the items on the receipt. Then, I pay with my credit card. Finally, I leave a tip on the table for the good service.', criteria: ['payment vocabulary', 'sequence'] },
        },
      ];
    }

    for (let j = 0; j < exerciseData.length; j++) {
      await prisma.exercise.create({
        data: { lessonId: lesson.id, exerciseType: exerciseData[j].exerciseType, prompt: exerciseData[j].prompt, meta: exerciseData[j].meta, position: j + 1 },
      });
    }
  }
  console.log('✅ Created Level 6: Image description & writing exercises for Skill 3');

  // Level 7: Final Assessment
  const level7Lessons = [
    { title: 'Final Restaurant Assessment', description: 'Test all knowledge learned about Restaurant English' },
  ];

  for (let i = 0; i < level7Lessons.length; i++) {
    const lesson = await prisma.lesson.create({
      data: { skillId: skillId, skillLevel: 7, title: level7Lessons[i].title, position: i + 1 },
    });

    const exerciseData = [
      {
        exerciseType: ExerciseType.match,
        prompt: 'Kiểm tra từ vựng: Nối các từ với nghĩa đúng',
        meta: { pairs: [ { left: 'Reservation', right: 'Sự đặt trước' }, { left: 'Beverage', right: 'Đồ uống' }, { left: 'Delicious', right: 'Ngon' }, { left: 'Receipt', right: 'Biên lai' }, { left: 'Waiter', right: 'Bồi bàn nam' } ] },
      },
      {
        exerciseType: ExerciseType.multiple_choice,
        prompt: 'Kiểm tra ngữ pháp: Chọn câu đúng',
        meta: {
          question: 'Câu nào sử dụng lời yêu cầu đúng cách?',
          options: [ { text: 'I want the menu now.', order: -1 }, { text: 'Could I have the menu, please?', order: 1 }, { text: 'Give me menu.', order: -1 } ],
          correctOrder: [1],
        },
      },
      {
        exerciseType: ExerciseType.fill_blank,
        prompt: 'Hoàn thành đoạn văn với từ vựng đúng:',
        meta: {
          sentences: [
            { text: 'We had a ___ for two.', correctAnswer: 'reservation', options: ['reservation', 'receipt', 'tip'] },
            { text: 'The ___ served us very well.', correctAnswer: 'waiter', options: ['waiter', 'menu', 'bill'] },
            { text: 'The food was very ___.', correctAnswer: 'delicious', options: ['delicious', 'receipt', 'order'] },
          ],
          context: 'Kiểm tra khả năng sử dụng từ vựng.',
        },
      },
      {
        exerciseType: ExerciseType.translate,
        prompt: 'Dịch câu sau để kiểm tra hiểu biết tổng thể:',
        meta: { sourceText: 'Could I have the bill, please? The food was delicious.', correctAnswer: 'Làm ơn cho tôi xin hóa đơn. Thức ăn rất ngon.', hints: ['bill = hóa đơn', 'delicious = ngon'] },
      },
      {
        exerciseType: ExerciseType.speak,
        prompt: 'Đọc câu tổng hợp kiến thức đã học:',
        meta: { prompt: 'Đọc: "I would like to recommend this restaurant to my friends."', expectedText: 'I would like to recommend this restaurant to my friends' },
      },
      {
        exerciseType: ExerciseType.listen_choose,
        prompt: 'Nghe và chọn câu đúng:',
        meta: {
          correctAnswer: 'The chef makes the best spicy soup.',
          options: [ 'The chef makes the best sweet soup.', 'The chef makes the best spicy soup.', 'The waiter makes the best spicy soup.' ],
          sentence: 'The chef makes the best spicy soup.',
        },
      },
      {
        exerciseType: ExerciseType.image_description,
        prompt: 'Mô tả toàn diện những gì bạn thấy:',
        meta: {
          imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          prompt: 'Describe everything you see in this restaurant scene using the vocabulary you have learned.',
          expectedResults: 'I see a nice restaurant with many tables. There are no waiters visible, but the atmosphere is warm. People are probably ordering delicious food and beverages from the menu.',
        },
      },
      {
        exerciseType: ExerciseType.writing_prompt,
        prompt: 'Viết bài tổng hợp toàn bộ kiến thức đã học:',
        meta: {
          prompt: 'Write about a perfect dining out experience. Use vocabulary words like reservation, menu, waiter, delicious, and bill.',
          minWords: 60,
          maxWords: 120,
          exampleAnswer: 'My perfect dining out experience starts with a reservation at a nice restaurant. When we arrive, the friendly waiter gives us the menu. I would like to order a fresh appetizer and a spicy main course. The chef cooks the food perfectly and it is very delicious. After the meal, we order a sweet dessert. Finally, I ask for the bill. I pay with my card and leave a generous tip because the service was excellent.',
          criteria: ['vocabulary usage', 'comprehensive knowledge'],
        },
      },
    ];

    for (let j = 0; j < exerciseData.length; j++) {
      await prisma.exercise.create({
        data: { lessonId: lesson.id, exerciseType: exerciseData[j].exerciseType, prompt: exerciseData[j].prompt, meta: exerciseData[j].meta, position: j + 1 },
      });
    }
  }
  console.log('✅ Created Level 7: Final comprehensive assessment for Skill 3');
}
