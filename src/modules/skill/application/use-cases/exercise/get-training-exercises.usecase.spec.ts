import { GetTrainingExercisesUseCase } from './get-training-exercises.usecase';
import { Exercise, ExerciseType } from '../../../domain/entities/exercise.entity';

describe('GetTrainingExercisesUseCase', () => {
  let useCase: GetTrainingExercisesUseCase;
  let trainingExerciseRepository: any;

  const mockExercise = (id: string) =>
    new Exercise(id, 'l1', ExerciseType.FILL_BLANK, 'prompt');

  beforeEach(() => {
    trainingExerciseRepository = {
      findFrequentlyIncorrect: jest.fn().mockResolvedValue([]),
      findExercisesWithLowMastery: jest.fn().mockResolvedValue([]),
      findExercisesWithNoMastery: jest.fn().mockResolvedValue([]),
      findRandomExercises: jest.fn().mockResolvedValue([]),
    };
    useCase = new GetTrainingExercisesUseCase(trainingExerciseRepository);
  });

  it('should return a training lesson with exercises', async () => {
    trainingExerciseRepository.findFrequentlyIncorrect.mockResolvedValue([
      mockExercise('e1'), mockExercise('e2'),
    ]);
    trainingExerciseRepository.findExercisesWithLowMastery.mockResolvedValue([
      mockExercise('e3'),
    ]);
    trainingExerciseRepository.findExercisesWithNoMastery.mockResolvedValue([
      mockExercise('e4'),
    ]);
    trainingExerciseRepository.findRandomExercises.mockResolvedValue([
      mockExercise('e5'), mockExercise('e6'), mockExercise('e7'),
      mockExercise('e8'), mockExercise('e9'), mockExercise('e10'),
    ]);

    const result = await useCase.execute('user-1');

    expect(result.title).toBe('Training Practice');
    expect(result.skillId).toBe('training');
    expect(result.exercises.length).toBeLessThanOrEqual(10);
    expect(result.id).toContain('training-user-1');
  });

  it('should fill with random exercises when not enough', async () => {
    trainingExerciseRepository.findRandomExercises.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => mockExercise(`r${i}`)),
    );

    const result = await useCase.execute('user-1');
    expect(result.exercises.length).toBeLessThanOrEqual(10);
    expect(trainingExerciseRepository.findRandomExercises).toHaveBeenCalled();
  });

  it('should deduplicate exercises across sources', async () => {
    const same = mockExercise('e1');
    trainingExerciseRepository.findFrequentlyIncorrect.mockResolvedValue([same]);
    trainingExerciseRepository.findExercisesWithLowMastery.mockResolvedValue([same]);
    trainingExerciseRepository.findExercisesWithNoMastery.mockResolvedValue([same]);

    const result = await useCase.execute('user-1');
    const ids = result.exercises.map((e: any) => e.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  it('should call repository with correct parameters', async () => {
    await useCase.execute('user-1');

    expect(trainingExerciseRepository.findFrequentlyIncorrect).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ minIncorrectCount: 2, maxSuccessRate: 0.5 }),
    );
    expect(trainingExerciseRepository.findExercisesWithLowMastery).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ maxMasteryLevel: 1 }),
    );
    expect(trainingExerciseRepository.findExercisesWithNoMastery).toHaveBeenCalledWith(
      'user-1',
      expect.any(Number),
    );
  });
});
