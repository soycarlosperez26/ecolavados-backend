import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AiInspectionRunStatus,
  EventType,
  InspectionResult,
  InspectionStatus,
  WashOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { RequestAiAnalysisDto } from './dto/request-ai-analysis.dto';
import { CertifyInspectionDto } from './dto/certify-inspection.dto';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createForOrder(
    washOrderId: string,
    dto: CreateInspectionDto,
    currentUserId: string,
  ) {
    const order = await this.prisma.washOrder.findUnique({
      where: { id: washOrderId },
      include: { inspections: true },
    });

    if (!order) {
      throw new NotFoundException(`WashOrder ${washOrderId} not found`);
    }

    const inspectorId = dto.inspectorId ?? currentUserId;
    await this.ensureUserExists(inspectorId);

    const inspection = await this.prisma.inspection.create({
      data: {
        type: dto.type,
        notes: dto.notes,
        washOrderId,
        tankId: order.tankId,
        inspectorId,
        status: InspectionStatus.IN_PROGRESS,
        performedAt: new Date(),
      },
    });

    return inspection;
  }

  async findByOrder(washOrderId: string) {
    return this.prisma.inspection.findMany({
      where: { washOrderId },
      include: {
        inspector: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        aiRuns: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(inspectionId: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        inspector: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        washOrder: {
          include: {
            evidences: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        aiRuns: {
          orderBy: { createdAt: 'desc' },
        },
        findings: true,
      },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection ${inspectionId} not found`);
    }

    return inspection;
  }

  async requestAiAnalysis(
    _inspectionId: string,
    _requestedById: string,
    _dto: RequestAiAnalysisDto,
  ) {
    throw new ServiceUnavailableException(
      'AI analysis is not available in this deployment (Redis/BullMQ required)',
    );
  }

  async getAiAnalysisResult(inspectionId: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        washOrder: true,
        aiRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        findings: {
          where: { inspectionId },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection ${inspectionId} not found`);
    }

    return {
      inspectionId,
      orderStatus: inspection.washOrder?.status ?? null,
      latestRun: inspection.aiRuns[0] ?? null,
      findings: inspection.findings,
    };
  }

  async certifyInspection(
    inspectionId: string,
    reviewerId: string,
    dto: CertifyInspectionDto,
  ) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        washOrder: true,
        aiRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection ${inspectionId} not found`);
    }

    if (!inspection.washOrderId || !inspection.washOrder) {
      throw new BadRequestException(
        'Inspection must be associated to a wash order',
      );
    }

    const latestRun = inspection.aiRuns[0];
    if (!latestRun || latestRun.status !== AiInspectionRunStatus.COMPLETED) {
      throw new BadRequestException(
        'Inspection must have a completed AI run before certification',
      );
    }

    const nextOrderStatus = dto.approved
      ? WashOrderStatus.COMPLETED
      : WashOrderStatus.REJECTED;

    await this.prisma.$transaction(async (tx) => {
      await tx.inspection.update({
        where: { id: inspectionId },
        data: {
          status: InspectionStatus.COMPLETED,
          completedAt: new Date(),
          overallResult: dto.approved
            ? InspectionResult.PASS
            : InspectionResult.FAIL,
          notes: dto.notes
            ? [inspection.notes, dto.notes].filter(Boolean).join('\n')
            : inspection.notes,
        },
      });

      await tx.washOrder.update({
        where: { id: inspection.washOrderId! },
        data: {
          status: nextOrderStatus,
          completedAt: dto.approved ? new Date() : inspection.washOrder.completedAt,
        },
      });
    });

    await this.eventsService.create({
      type: dto.approved
        ? EventType.TANK_QI_INSPECTION_PASSED
        : EventType.TANK_QI_INSPECTION_FAILED,
      aggregateId: inspectionId,
      aggregateType: 'inspection',
      payload: {
        aiRunId: latestRun.id,
        approved: dto.approved,
        notes: dto.notes ?? null,
      },
      metadata: { reviewerId },
      tankId: inspection.tankId,
      washOrderId: inspection.washOrderId,
      triggeredByUserId: reviewerId,
    });

    return {
      inspectionId,
      approved: dto.approved,
      orderStatus: nextOrderStatus,
    };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }
}
