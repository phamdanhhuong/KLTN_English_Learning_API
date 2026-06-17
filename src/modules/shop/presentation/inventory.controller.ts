import { Controller, Get, Put, Post, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../application/services/inventory.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getInventory(@CurrentUser('id') userId: string) {
    if (!userId) throw new BadRequestException('User not found');
    return this.inventoryService.getInventory(userId);
  }

  @Get('equipped')
  async getEquippedItem(@CurrentUser('id') userId: string) {
    if (!userId) throw new BadRequestException('User not found');
    return this.inventoryService.getEquippedItem(userId);
  }

  @Put('equip/:itemId')
  async equipItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    if (!userId) throw new BadRequestException('User not found');
    return this.inventoryService.equipItem(userId, itemId);
  }

  @Post('use/:itemId')
  async useItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    if (!userId) throw new BadRequestException('User not found');
    return this.inventoryService.useItem(userId, itemId);
  }
}
