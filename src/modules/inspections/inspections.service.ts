import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import {
  AiInspectionRunStatus,
  EventType,
  InspectionResult,
  InspectionStatus,
  InspectionType,
  Prisma,
  UserRole,
  WashOrderStatus,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import {
  AI_INSPECTION_ANALYZE_JOB,
  AI_INSPECTION_QUEUE,
  AI_SUPPORTED_MIME_TYPES,
} from '../ai/ai.constants';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { RequestAiAnalysisDto } from './dto/request-ai-analysis.dto';
import { CertifyInspectionDto } from './dto/certify-inspection.dto';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventsService: EventsService,
    @InjectQueue(AI_INSPECTION_QUEUE)
    private readonly aiInspectionQueue: Queue,
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
    inspectionId: string,
    requestedById: string,
    dto: RequestAiAnalysisDto,
  ) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
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

    this.assertOrderStatusAllowsAnalysis(inspection.washOrder.status);

    const evidence = inspection.washOrder.evidences.filter((item) =>
      item.mimeType ? AI_SUPPORTED_MIME_TYPES.includes(item.mimeType as any) : true,
    );

    const minImages = Number(this.config.get('AI_MIN_IMAGES_REQUIRED') ?? 3);
    if (evidence.length < minImages) {
      throw new BadRequestException(
        `At least ${minImages} evidences are required to analyze this inspection`,
      );
    }

    const activeStatuses: AiInspectionRunStatus[] = [
      AiInspectionRunStatus.QUEUED,
      AiInspectionRunStatus.PROCESSING,
    ];
    const activeRun = inspection.aiRuns.find((item) =>
      activeStatuses.includes(item.status),
    );

    if (activeRun) {
      throw new ConflictException(
        `Inspection already has an active AI run (${activeRun.id})`,
      );
    }

    const evidenceHash = this.buildEvidenceHash(evidence);
    const latestCompletedRun = inspection.aiRuns.find(
      (item) =>
        item.status === AiInspectionRunStatus.COMPLETED &&
        item.evidenceHash === evidenceHash,
    );

    if (latestCompletedRun && !dto.force) {
      return {
        inspectionId,
        aiRunId: latestCompletedRun.id,
        status: latestCompletedRun.status,
        reused: true,
      };
    }

    const correlationId = randomUUID();
    const aiRun = await this.prisma.aiInspectionRun.create({
      data: {
        inspectionId,
        washOrderId: inspection.washOrderId,
        requestedById,
        status: AiInspectionRunStatus.QUEUED,
        model: this.config.get<string>('OPENAI_VISION_MODEL') || 'gpt-4.1-mini',
        evidenceCount: evidence.length,
        correlationId,
        evidenceHash,
      },
    });

    await this.prisma.washOrder.update({
      where: { id: inspection.washOrderId },
      data: {
        status: WashOrderStatus.IA_REVIEW,
      },
    });

    await this.eventsService.create({
      type: EventType.INSPECTION_AI_QUEUED,
      aggregateId: inspectionId,
      aggregateType: 'inspection',
      payload: { aiRunId: aiRun.id, evidenceCount: evidence.length },
      metadata: { correlationId },
      tankId: inspection.tankId,
      washOrderId: inspection.washOrderId,
      triggeredByUserId: requestedById,
    });

    const maxRetries = Number(this.config.get('AI_MAX_RETRIES') ?? 3);
    const retryBackoff = Number(this.config.get('AI_RETRY_BACKOFF_MS') ?? 5000);

    await this.aiInspectionQueue.add(
      AI_INSPECTION_ANALYZE_JOB,
      {
        aiRunId: aiRun.id,
        correlationId,
      },
      {
        attempts: maxRetries,
        backoff: {
          type: 'exponential',
          delay: retryBackoff,
        },
      },
    );

    return {
      inspectionId,
      aiRunId: aiRun.id,
      status: aiRun.status,
      reused: false,
    };
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
      : WashOrderStatus.BLOCKED;

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

  private buildEvidenceHash(
    evidence: Array<{
      id: string;
      fileUrl: string;
      hash?: string | null;
      createdAt: Date;
    }>,
  ) {
    const input = evidence
      .map((item) => [item.id, item.hash ?? item.fileUrl, item.createdAt.toISOString()].join(':'))
      .sort()
      .join('|');

    return createHash('sha256').update(input).digest('hex');
  }

  private assertOrderStatusAllowsAnalysis(status: WashOrderStatus) {
    const allowedStatuses: WashOrderStatus[] = [
      WashOrderStatus.IN_PROGRESS,
      WashOrderStatus.PREPARATION,
      WashOrderStatus.CLEANING,
      WashOrderStatus.DRYING,
      WashOrderStatus.PRE_INSPECTION,
      WashOrderStatus.WAITING_QI,
      WashOrderStatus.BLOCKED,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Cannot request AI analysis while wash order is ${status}`,
      );
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }
}
