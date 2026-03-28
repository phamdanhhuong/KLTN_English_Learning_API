import { NotFoundException } from '@nestjs/common';
import { GetExerciseByIdUseCase } from './get-exercise-by-id.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';

describe('GetExerciseByIdUseCase', () => {
  let useCase: GetExerciseByIdUseCase;
  let exerciseRepository: any;

  beforeEach(() => {
    exerciseRepository = { findById: jest.fn() };
    useCase = new GetExerciseByIdUseCase(exerciseRepository);
  });

  it('should return exercise DTO when found', async () => {
    exerciseRepository.findById.mockResolvedValue(new Exercise('e1', 'l1', ExerciseType.FILL_BLANK, 'Fill'));
    const result = await useCase.execute('e1');
    expect(result.id).toBe('e1');
  });

  it('should throw NotFoundException when not found', async () => {
    exerciseRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
