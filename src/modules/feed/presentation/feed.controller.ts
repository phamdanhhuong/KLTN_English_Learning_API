import {
  Controller, Get, Post, Put, Delete,
  UseGuards, Request, Param, Query, Body,
  HttpCode, HttpStatus, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FeedService } from '../application/services/feed.service';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

enum ReactionTypeDto {
  CONGRATS = 'CONGRATS',
  FIRE = 'FIRE',
  CLAP = 'CLAP',
  HEART = 'HEART',
  STRONG = 'STRONG',
}

class ToggleReactionDto {
  @IsEnum(ReactionTypeDto)
  reactionType: string;
}

class CommentBodyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;
}

@Controller('users/feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.feedService.getFeed(
      req.user.sub,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('user/:userId')
  async getUserPosts(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.feedService.getUserPosts(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Delete('posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Request() req: any, @Param('postId') postId: string) {
    try {
      await this.feedService.deletePost(postId, req.user.sub);
    } catch (e: any) {
      if (e.message?.includes('Not authorized')) throw new ForbiddenException(e.message);
      throw new NotFoundException('Post not found');
    }
  }

  @Post('posts/:postId/reactions')
  @HttpCode(HttpStatus.OK)
  async toggleReaction(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() dto: ToggleReactionDto,
  ) {
    const action = await this.feedService.toggleReaction(postId, req.user.sub, dto.reactionType);
    return { action };
  }

  @Get('posts/:postId/reactions')
  async getPostReactions(
    @Param('postId') postId: string,
    @Query('reactionType') reactionType?: string,
  ) {
    return this.feedService.getPostReactions(postId, reactionType);
  }

  @Post('posts/:postId/comments')
  async addComment(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() dto: CommentBodyDto,
  ) {
    return this.feedService.addComment(postId, req.user.sub, dto.content);
  }

  @Get('posts/:postId/comments')
  async getPostComments(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.feedService.getPostComments(
      postId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Put('comments/:commentId')
  async updateComment(
    @Request() req: any,
    @Param('commentId') commentId: string,
    @Body() dto: CommentBodyDto,
  ) {
    try {
      return this.feedService.updateComment(commentId, req.user.sub, dto.content);
    } catch (e: any) {
      if (e.message?.includes('Not authorized')) throw new ForbiddenException(e.message);
      throw new NotFoundException('Comment not found');
    }
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
    try {
      await this.feedService.deleteComment(commentId, req.user.sub);
    } catch (e: any) {
      if (e.message?.includes('Not authorized')) throw new ForbiddenException(e.message);
      throw new NotFoundException('Comment not found');
    }
  }
}
