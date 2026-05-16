import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AI_INSPECTION_QUEUE } from './ai.constants';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    EventsModule,
    BullModule.registerQueue({
      name: AI_INSPECTION_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [AiService, AiProcessor],
  exports: [AiService, BullModule],
})
export class AiModule {}
