import { BadRequestException } from '@nestjs/common';
import { ReportUserUseCase, BlockUserUseCase, UnblockUserUseCase } from './report-block.usecase';

describe('ReportUserUseCase', () => {
  let useCase: ReportUserUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      userReport: { create: jest.fn() },
    };
    useCase = new ReportUserUseCase(prisma);
  });

  it('should submit a report successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u2' });
    const result = await useCase.execute('u1', 'u2', 'spam');
    expect(result.message).toContain('Report submitted');
    expect(prisma.userReport.create).toHaveBeenCalled();
  });

  it('should throw BadRequestException when reporting yourself', async () => {
    await expect(useCase.execute('u1', 'u1', 'spam')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when target not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(useCase.execute('u1', 'u2', 'spam')).rejects.toThrow(BadRequestException);
  });
});

describe('BlockUserUseCase', () => {
  let useCase: BlockUserUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      userBlock: { findFirst: jest.fn(), create: jest.fn() },
    };
    useCase = new BlockUserUseCase(prisma);
  });

  it('should block a user', async () => {
    prisma.userBlock.findFirst.mockResolvedValue(null);
    const result = await useCase.execute('u1', 'u2');
    expect(result.message).toContain('blocked');
    expect(prisma.userBlock.create).toHaveBeenCalled();
  });

  it('should not duplicate block', async () => {
    prisma.userBlock.findFirst.mockResolvedValue({ id: 'existing' });
    await useCase.execute('u1', 'u2');
    expect(prisma.userBlock.create).not.toHaveBeenCalled();
  });

  it('should throw when blocking yourself', async () => {
    await expect(useCase.execute('u1', 'u1')).rejects.toThrow(BadRequestException);
  });
});

describe('UnblockUserUseCase', () => {
  let useCase: UnblockUserUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = { userBlock: { deleteMany: jest.fn() } };
    useCase = new UnblockUserUseCase(prisma);
  });

  it('should unblock a user', async () => {
    const result = await useCase.execute('u1', 'u2');
    expect(result.message).toContain('unblocked');
    expect(prisma.userBlock.deleteMany).toHaveBeenCalled();
  });
});
