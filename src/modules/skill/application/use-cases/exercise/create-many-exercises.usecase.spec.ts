import { CreateManyExercisesUseCase } from './create-many-exercises.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';
import { ExerciseTypeDto } from '../../dto/exercise.dto';

describe('CreateManyExercisesUseCase', () => {
  let useCase: CreateManyExercisesUseCase;
  let exerciseRepository: any;

  beforeEach(() => {
    exerciseRepository = {
      getNextAvailablePosition: jest.fn().mockResolvedValue(1),
      createMany: jest.fn(),
    };
    useCase = new CreateManyExercisesUseCase(exerciseRepository);
  });

  it('should create multiple exercises', async () => {
    const exercises = [
      new Exercise('e1', 'l1', ExerciseType.FILL_BLANK, 'p1', undefined, 1),
      new Exercise('e2', 'l1', ExerciseType.TRANSLATE, 'p2', undefined, 2),
    ];
    exerciseRepository.createMany.mockResolvedValue(exercises);

    const result = await useCase.execute([
      { lessonId: 'l1', exerciseType: ExerciseTypeDto.FILL_BLANK, prompt: 'p1', position: 1 },
      { lessonId: 'l1', exerciseType: ExerciseTypeDto.TRANSLATE, prompt: 'p2', position: 2 },
    ]);
    expect(result).toHaveLength(2);
  });

  it('should auto-assign positions when not provided', async () => {
    exerciseRepository.getNextAvailablePosition.mockResolvedValue(5);
    exerciseRepository.createMany.mockImplementation((es: Exercise[]) => Promise.resolve(es));

    await useCase.execute([{ lessonId: 'l1', exerciseType: ExerciseTypeDto.FILL_BLANK, prompt: 'p1' }]);
    expect(exerciseRepository.getNextAvailablePosition).toHaveBeenCalledWith('l1');
  });
});
