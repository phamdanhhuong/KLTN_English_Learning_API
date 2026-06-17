import { Controller, Get, Post, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ShopService } from '../application/services/shop.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  async getShopItems() {
    return this.shopService.getShopItems();
  }

  @Post('buy/:itemId')
  async buyItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    if (!userId) throw new BadRequestException('User not found');
    return this.shopService.buyItem(userId, itemId);
  }

  @Post('open-chest')
  async openChest(@CurrentUser('id') userId: string) {
    if (!userId) throw new BadRequestException('User not found');
    return this.shopService.openChest(userId);
  }
}
