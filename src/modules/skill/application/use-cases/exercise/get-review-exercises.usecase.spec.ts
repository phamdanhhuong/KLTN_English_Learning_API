import { GetReviewExercisesUseCase } from './get-review-exercises.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';

describe('GetReviewExercisesUseCase', () => {
  let useCase: GetReviewExercisesUseCase;
  let reviewExerciseRepository: any;

  const mockExercise = (id: string) =>
    new Exercise(id, 'l1', ExerciseType.FILL_BLANK, 'prompt');

  beforeEach(() => {
    reviewExerciseRepository = {
      findWordsForReview: jest.fn().mockResolvedValue([]),
      findGrammarsForReview: jest.fn().mockResolvedValue([]),
      findDifficultExercises: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn().mockResolvedValue([]),
      findByWordIds: jest.fn().mockResolvedValue([]),
      findByGrammarIds: jest.fn().mockResolvedValue([]),
      findRandomExercises: jest.fn().mockResolvedValue([]),
    };
    useCase = new GetReviewExercisesUseCase(reviewExerciseRepository);
  });

  it('should return a review lesson with exercises', async () => {
    reviewExerciseRepository.findDifficultExercises.mockResolvedValue([
      { exerciseId: 'e1', incorrectCount: 3, successRate: 0.3 },
    ]);
    reviewExerciseRepository.findByIds.mockResolvedValue([mockExercise('e1')]);
    reviewExerciseRepository.findRandomExercises.mockResolvedValue([
      mockExercise('e2'), mockExercise('e3'), mockExercise('e4'), mockExercise('e5'),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.title).toBe('Review Practice');
    expect(result.skillId).toBe('review');
    expect(result.exercises.length).toBeLessThanOrEqual(5);
  });

  it('should fill with random exercises when not enough review items', async () => {
    reviewExerciseRepository.findRandomExercises.mockResolvedValue([
      mockExercise('r1'), mockExercise('r2'), mockExercise('r3'),
      mockExercise('r4'), mockExercise('r5'),
    ]);

    const result = await useCase.execute('user-1');
    expect(result.exercises.length).toBeLessThanOrEqual(5);
  });

  it('should deduplicate exercises', async () => {
    const same = mockExercise('e1');
    reviewExerciseRepository.findDifficultExercises.mockResolvedValue([
      { exerciseId: 'e1', incorrectCount: 3, successRate: 0.3 },
    ]);
    reviewExerciseRepository.findByIds.mockResolvedValue([same]);
    reviewExerciseRepository.findWordsForReview.mockResolvedValue(['w1']);
    reviewExerciseRepository.findByWordIds.mockResolvedValue([same]); // duplicate

    const result = await useCase.execute('user-1');
    const ids = result.exercises.map(e => e.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});
