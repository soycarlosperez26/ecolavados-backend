import { Module } from '@nestjs/common';
import { WashOrdersService } from './wash-orders.service';
import { WashOrdersController } from './wash-orders.controller';

@Module({
  controllers: [WashOrdersController],
  providers: [WashOrdersService],
  exports: [WashOrdersService],
})
export class WashOrdersModule {}
