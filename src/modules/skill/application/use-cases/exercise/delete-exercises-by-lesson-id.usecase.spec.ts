import { DeleteExercisesByLessonIdUseCase } from './delete-exercises-by-lesson-id.usecase';

describe('DeleteExercisesByLessonIdUseCase', () => {
  let useCase: DeleteExercisesByLessonIdUseCase;
  let exerciseRepository: any;

  beforeEach(() => {
    exerciseRepository = { deleteByLessonId: jest.fn() };
    useCase = new DeleteExercisesByLessonIdUseCase(exerciseRepository);
  });

  it('should delete all exercises for a lesson', async () => {
    await useCase.execute('l1');
    expect(exerciseRepository.deleteByLessonId).toHaveBeenCalledWith('l1');
  });
});
