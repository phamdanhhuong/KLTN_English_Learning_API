import { GetExerciseCountUseCase } from './get-exercise-count.usecase';

describe('GetExerciseCountUseCase', () => {
  let useCase: GetExerciseCountUseCase;
  let exerciseRepository: any;

  beforeEach(() => {
    exerciseRepository = { countByLessonId: jest.fn() };
    useCase = new GetExerciseCountUseCase(exerciseRepository);
  });

  it('should return exercise count for a lesson', async () => {
    exerciseRepository.countByLessonId.mockResolvedValue(5);
    const result = await useCase.execute('l1');
    expect(result).toBe(5);
  });

  it('should return 0 when no exercises', async () => {
    exerciseRepository.countByLessonId.mockResolvedValue(0);
    const result = await useCase.execute('l1');
    expect(result).toBe(0);
  });
});
