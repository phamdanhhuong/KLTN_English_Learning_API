import { GetLessonsBySkillLevelUseCase } from './get-lessons-by-skill-level.usecase';
import { Lesson } from '../../../domain/entities/lesson.entity';

describe('GetLessonsBySkillLevelUseCase', () => {
  let useCase: GetLessonsBySkillLevelUseCase;
  let lessonRepository: any;

  beforeEach(() => {
    lessonRepository = { findBySkillLevel: jest.fn() };
    useCase = new GetLessonsBySkillLevelUseCase(lessonRepository);
  });

  it('should return lessons for a skill level', async () => {
    lessonRepository.findBySkillLevel.mockResolvedValue([
      new Lesson('l1', 's1', 1, 'Lesson 1'),
    ]);
    const result = await useCase.execute('s1', 1);
    expect(result).toHaveLength(1);
    expect(lessonRepository.findBySkillLevel).toHaveBeenCalledWith('s1', 1);
  });
});
