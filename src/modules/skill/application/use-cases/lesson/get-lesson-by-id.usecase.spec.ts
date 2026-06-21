import { NotFoundException } from '@nestjs/common';
import { GetLessonByIdUseCase } from './get-lesson-by-id.usecase';
import { Lesson } from '../../../domain/entities/lesson.entity';

describe('GetLessonByIdUseCase', () => {
  let useCase: GetLessonByIdUseCase;
  let lessonRepository: any;

  let exerciseRepository: any;
  let chatbotClient: any;

  beforeEach(() => {
    lessonRepository = { findById: jest.fn() };
    exerciseRepository = { createMany: jest.fn() };
    chatbotClient = { generateExercises: jest.fn() };
    useCase = new GetLessonByIdUseCase(lessonRepository, exerciseRepository, chatbotClient);
  });

  it('should return lesson DTO when found', async () => {
    lessonRepository.findById.mockResolvedValue(
      new Lesson('l1', 's1', 1, 'Lesson 1'),
    );
    const result = await useCase.execute('l1');
    expect(result.id).toBe('l1');
    expect(result.title).toBe('Lesson 1');
  });

  it('should throw NotFoundException when not found', async () => {
    lessonRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
