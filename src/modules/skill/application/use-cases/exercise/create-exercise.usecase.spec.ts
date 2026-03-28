import { BadRequestException } from '@nestjs/common';
import { CreateExerciseUseCase } from './create-exercise.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';
import { ExerciseTypeDto } from '../../dto/exercise.dto';

describe('CreateExerciseUseCase', () => {
  let useCase: CreateExerciseUseCase;
  let exerciseRepository: any;
  let metaValidator: any;

  beforeEach(() => {
    exerciseRepository = {
      findByLessonIdAndPosition: jest.fn(),
      getNextAvailablePosition: jest.fn(),
      create: jest.fn(),
    };
    metaValidator = { getMetaValidationErrors: jest.fn().mockReturnValue([]) };
    useCase = new CreateExerciseUseCase(exerciseRepository, metaValidator);
  });

  it('should create exercise with auto-assigned position', async () => {
    exerciseRepository.getNextAvailablePosition.mockResolvedValue(1);
    exerciseRepository.create.mockImplementation((e: Exercise) => Promise.resolve(e));

    const result = await useCase.execute({
      lessonId: 'l1', exerciseType: ExerciseTypeDto.MULTIPLE_CHOICE, prompt: 'What is...?',
    });
    expect(result.lessonId).toBe('l1');
    expect(result.position).toBe(1);
  });

  it('should throw BadRequestException when position is taken', async () => {
    exerciseRepository.findByLessonIdAndPosition.mockResolvedValue(
      new Exercise('e2', 'l1', ExerciseType.FILL_BLANK, 'x', undefined, 1),
    );

    await expect(
      useCase.execute({ lessonId: 'l1', exerciseType: ExerciseTypeDto.FILL_BLANK, prompt: 'x', position: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for invalid meta', async () => {
    metaValidator.getMetaValidationErrors.mockReturnValue(['Missing options']);

    await expect(
      useCase.execute({ lessonId: 'l1', exerciseType: ExerciseTypeDto.MULTIPLE_CHOICE, meta: {} as any }),
    ).rejects.toThrow(BadRequestException);
  });
});

