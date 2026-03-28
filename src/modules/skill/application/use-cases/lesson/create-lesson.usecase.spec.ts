import { BadRequestException } from '@nestjs/common';
import { CreateLessonUseCase } from './create-lesson.usecase';
import { Lesson } from '../../../domain/entities/lesson.entity';

describe('CreateLessonUseCase', () => {
  let useCase: CreateLessonUseCase;
  let lessonRepository: any;

  beforeEach(() => {
    lessonRepository = {
      findBySkillLevelAndPosition: jest.fn(),
      getNextAvailablePosition: jest.fn(),
      create: jest.fn(),
    };
    useCase = new CreateLessonUseCase(lessonRepository);
  });

  it('should create a lesson with auto-assigned position', async () => {
    lessonRepository.getNextAvailablePosition.mockResolvedValue(3);
    lessonRepository.create.mockImplementation((l: Lesson) => Promise.resolve(l));

    const result = await useCase.execute({ skillId: 's1', skillLevel: 1, title: 'Lesson 1' });
    expect(result.title).toBe('Lesson 1');
    expect(result.position).toBe(3);
  });

  it('should create a lesson with explicit position', async () => {
    lessonRepository.findBySkillLevelAndPosition.mockResolvedValue(null);
    lessonRepository.create.mockImplementation((l: Lesson) => Promise.resolve(l));

    const result = await useCase.execute({ skillId: 's1', skillLevel: 1, title: 'Lesson 1', position: 5 });
    expect(result.position).toBe(5);
  });

  it('should throw BadRequestException when position is taken', async () => {
    lessonRepository.findBySkillLevelAndPosition.mockResolvedValue(new Lesson('l2', 's1', 1, 'Other', 5));

    await expect(
      useCase.execute({ skillId: 's1', skillLevel: 1, title: 'Lesson 1', position: 5 }),
    ).rejects.toThrow(BadRequestException);
  });
});
