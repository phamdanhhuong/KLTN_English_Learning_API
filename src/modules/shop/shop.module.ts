import { Module } from '@nestjs/common';
import { ShopController } from './presentation/shop.controller';
import { InventoryController } from './presentation/inventory.controller';
import { ShopService } from './application/services/shop.service';
import { InventoryService } from './application/services/inventory.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ShopController, InventoryController],
  providers: [ShopService, InventoryService],
  exports: [ShopService, InventoryService],
})
export class ShopModule {}
