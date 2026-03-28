import { NotFoundException } from '@nestjs/common';
import { DeleteLessonUseCase } from './delete-lesson.usecase';
import { Lesson } from '../../../domain/entities/lesson.entity';

describe('DeleteLessonUseCase', () => {
  let useCase: DeleteLessonUseCase;
  let lessonRepository: any;

  beforeEach(() => {
    lessonRepository = { findById: jest.fn(), delete: jest.fn() };
    useCase = new DeleteLessonUseCase(lessonRepository);
  });

  it('should delete an existing lesson', async () => {
    lessonRepository.findById.mockResolvedValue(new Lesson('l1', 's1', 1, 'Lesson 1'));
    await useCase.execute('l1');
    expect(lessonRepository.delete).toHaveBeenCalledWith('l1');
  });

  it('should throw NotFoundException when lesson not found', async () => {
    lessonRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
