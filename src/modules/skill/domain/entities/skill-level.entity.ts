import { Lesson } from './lesson.entity';

export class SkillLevel {
  constructor(
    public readonly skillId: string,
    public readonly level: number,
    public readonly lessons?: Lesson[],
  ) {}

  static create(skillId: string, level: number): SkillLevel {
    if (level < 1 || level > 7) {
      throw new Error('Skill level must be between 1 and 7');
    }
    return new SkillLevel(skillId, level);
  }

  getLevelDescription(): string {
    const descriptions: Record<number, string> = {
      1: 'học từ mới - nghe từ mới rồi chọn trắc nghiệm',
      2: 'học ngữ pháp - nhìn câu mẫu rồi hoàn thành câu tương tự (5 câu)',
      3: 'luyện tập - 5 bài (mỗi bài 5 câu hỏi)',
      4: 'nghe podcast',
      5: 'luyện tập nặng hơn - 5 bài (mỗi bài 5 câu hỏi)',
      6: 'luyện viết',
      7: 'kiểm tra',
    };
    return descriptions[this.level] || 'Unknown level';
  }

  getNextLevel(): number | null {
    return this.level < 7 ? this.level + 1 : null;
  }

  getPreviousLevel(): number | null {
    return this.level > 1 ? this.level - 1 : null;
  }
}
