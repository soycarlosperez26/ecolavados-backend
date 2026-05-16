import { Injectable } from '@nestjs/common';
import { EventType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    type: EventType;
    aggregateId: string;
    aggregateType: string;
    payload: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
    tankId?: string | null;
    washOrderId?: string | null;
    triggeredByUserId?: string | null;
    triggeredByAgentId?: string | null;
  }) {
    return this.prisma.canonicalEvent.create({
      data: {
        type: params.type,
        aggregateId: params.aggregateId,
        aggregateType: params.aggregateType,
        payload: params.payload,
        metadata: params.metadata,
        tankId: params.tankId ?? undefined,
        washOrderId: params.washOrderId ?? undefined,
        triggeredByUserId: params.triggeredByUserId ?? undefined,
        triggeredByAgentId: params.triggeredByAgentId ?? undefined,
      },
    });
  }
}
