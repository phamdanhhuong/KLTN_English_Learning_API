import { GetLessonsBySkillIdUseCase } from './get-lessons-by-skill-id.usecase';
import { Lesson } from '../../../domain/entities/lesson.entity';

describe('GetLessonsBySkillIdUseCase', () => {
  let useCase: GetLessonsBySkillIdUseCase;
  let lessonRepository: any;

  beforeEach(() => {
    lessonRepository = { findBySkillId: jest.fn() };
    useCase = new GetLessonsBySkillIdUseCase(lessonRepository);
  });

  it('should return lessons for a skill', async () => {
    lessonRepository.findBySkillId.mockResolvedValue([
      new Lesson('l1', 's1', 1, 'Lesson 1'),
      new Lesson('l2', 's1', 2, 'Lesson 2'),
    ]);
    const result = await useCase.execute('s1');
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no lessons', async () => {
    lessonRepository.findBySkillId.mockResolvedValue([]);
    const result = await useCase.execute('s1');
    expect(result).toHaveLength(0);
  });
});
