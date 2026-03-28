import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateExerciseUseCase } from './update-exercise.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';

describe('UpdateExerciseUseCase', () => {
  let useCase: UpdateExerciseUseCase;
  let exerciseRepository: any;
  let metaValidator: any;
  const existing = new Exercise('e1', 'l1', ExerciseType.FILL_BLANK, 'Old prompt', undefined, 1);

  beforeEach(() => {
    exerciseRepository = {
      findById: jest.fn(),
      findByLessonIdAndPosition: jest.fn(),
      update: jest.fn(),
    };
    metaValidator = { getMetaValidationErrors: jest.fn().mockReturnValue([]) };
    useCase = new UpdateExerciseUseCase(exerciseRepository, metaValidator);
  });

  it('should update exercise prompt', async () => {
    exerciseRepository.findById.mockResolvedValue(existing);
    exerciseRepository.update.mockImplementation((e: Exercise) => Promise.resolve(e));

    const result = await useCase.execute('e1', { prompt: 'New prompt' });
    expect(result.prompt).toBe('New prompt');
  });

  it('should throw NotFoundException when exercise not found', async () => {
    exerciseRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent', { prompt: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException for invalid meta', async () => {
    exerciseRepository.findById.mockResolvedValue(existing);
    metaValidator.getMetaValidationErrors.mockReturnValue(['Invalid field']);

    await expect(useCase.execute('e1', { meta: {} as any })).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when position is taken', async () => {
    exerciseRepository.findById.mockResolvedValue(existing);
    exerciseRepository.findByLessonIdAndPosition.mockResolvedValue(
      new Exercise('e2', 'l1', ExerciseType.TRANSLATE, 'x', undefined, 5),
    );

    await expect(useCase.execute('e1', { position: 5 })).rejects.toThrow(BadRequestException);
  });
});
