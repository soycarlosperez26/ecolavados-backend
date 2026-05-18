import { Module } from '@nestjs/common';
import { WashOrdersService } from './wash-orders.service';
import { WashOrdersController, WashOrdersExternalController } from './wash-orders.controller';

@Module({
  controllers: [WashOrdersController, WashOrdersExternalController],
  providers: [WashOrdersService],
  exports: [WashOrdersService],
})
export class WashOrdersModule {}
