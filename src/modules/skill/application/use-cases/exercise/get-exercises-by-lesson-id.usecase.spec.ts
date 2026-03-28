import { GetExercisesByLessonIdUseCase } from './get-exercises-by-lesson-id.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';

describe('GetExercisesByLessonIdUseCase', () => {
  let useCase: GetExercisesByLessonIdUseCase;
  let exerciseRepository: any;

  beforeEach(() => {
    exerciseRepository = { findByLessonId: jest.fn() };
    useCase = new GetExercisesByLessonIdUseCase(exerciseRepository);
  });

  it('should return exercises for a lesson', async () => {
    exerciseRepository.findByLessonId.mockResolvedValue([
      new Exercise('e1', 'l1', ExerciseType.FILL_BLANK),
      new Exercise('e2', 'l1', ExerciseType.TRANSLATE),
    ]);
    const result = await useCase.execute('l1');
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no exercises', async () => {
    exerciseRepository.findByLessonId.mockResolvedValue([]);
    const result = await useCase.execute('l1');
    expect(result).toHaveLength(0);
  });
});
