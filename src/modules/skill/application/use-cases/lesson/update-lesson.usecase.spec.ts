import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateLessonUseCase } from './update-lesson.usecase';
import { Lesson } from '../../../domain/entities/lesson.entity';

describe('UpdateLessonUseCase', () => {
  let useCase: UpdateLessonUseCase;
  let lessonRepository: any;
  const existing = new Lesson('l1', 's1', 1, 'Old Title', 1);

  beforeEach(() => {
    lessonRepository = {
      findById: jest.fn(),
      findBySkillLevelAndPosition: jest.fn(),
      update: jest.fn(),
    };
    useCase = new UpdateLessonUseCase(lessonRepository);
  });

  it('should update lesson title', async () => {
    lessonRepository.findById.mockResolvedValue(existing);
    lessonRepository.update.mockImplementation((l: Lesson) => Promise.resolve(l));

    const result = await useCase.execute('l1', { title: 'New Title' });
    expect(result.title).toBe('New Title');
  });

  it('should update lesson position when not taken', async () => {
    lessonRepository.findById.mockResolvedValue(existing);
    lessonRepository.findBySkillLevelAndPosition.mockResolvedValue(null);
    lessonRepository.update.mockImplementation((l: Lesson) => Promise.resolve(l));

    const result = await useCase.execute('l1', { position: 5 });
    expect(result.position).toBe(5);
  });

  it('should throw BadRequestException when position is taken', async () => {
    lessonRepository.findById.mockResolvedValue(existing);
    lessonRepository.findBySkillLevelAndPosition.mockResolvedValue(new Lesson('l2', 's1', 1, 'Other', 5));

    await expect(useCase.execute('l1', { position: 5 })).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when lesson not found', async () => {
    lessonRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent', { title: 'X' })).rejects.toThrow(NotFoundException);
  });
});
