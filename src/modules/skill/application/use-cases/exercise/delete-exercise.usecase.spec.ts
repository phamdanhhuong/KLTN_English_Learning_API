import { NotFoundException } from '@nestjs/common';
import { DeleteExerciseUseCase } from './delete-exercise.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';

describe('DeleteExerciseUseCase', () => {
  let useCase: DeleteExerciseUseCase;
  let exerciseRepository: any;

  beforeEach(() => {
    exerciseRepository = { findById: jest.fn(), delete: jest.fn() };
    useCase = new DeleteExerciseUseCase(exerciseRepository);
  });

  it('should delete an existing exercise', async () => {
    exerciseRepository.findById.mockResolvedValue(new Exercise('e1', 'l1', ExerciseType.FILL_BLANK));
    await useCase.execute('e1');
    expect(exerciseRepository.delete).toHaveBeenCalledWith('e1');
  });

  it('should throw NotFoundException when not found', async () => {
    exerciseRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
