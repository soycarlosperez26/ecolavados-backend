import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  AgentActionStatus,
  AgentType,
  AiClassification,
  AiInspectionRunStatus,
  EventType,
  FindingSeverity,
  InspectionResult,
  Prisma,
  WashOrderStatus,
} from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { AI_INSPECTION_ANALYZE_JOB, AI_INSPECTION_QUEUE } from './ai.constants';
import { AiService } from './ai.service';
import {
  AiInspectionJobPayload,
  NormalizedAiFinding,
} from './interfaces/ai-inspection-result.interface';

@Processor(AI_INSPECTION_QUEUE, { concurrency: 2 })
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly aiService: AiService,
    private readonly eventsService: EventsService,
  ) {
    super();
  }

  async process(job: Job<AiInspectionJobPayload>): Promise<void> {
    if (job.name !== AI_INSPECTION_ANALYZE_JOB) {
      this.logger.warn(`Ignoring unsupported job ${job.name}`);
      return;
    }

    const run = await this.prisma.aiInspectionRun.findUnique({
      where: { id: job.data.aiRunId },
      include: {
        inspection: true,
        washOrder: {
          include: {
            tank: true,
            evidences: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!run) {
      this.logger.warn(`AiInspectionRun ${job.data.aiRunId} not found`);
      return;
    }

    const attempt = job.attemptsMade + 1;

    await this.prisma.aiInspectionRun.update({
      where: { id: run.id },
      data: {
        status: AiInspectionRunStatus.PROCESSING,
        startedAt: new Date(),
        errorMessage: null,
        attempts: attempt,
      },
    });

    await this.eventsService.create({
      type: EventType.INSPECTION_AI_STARTED,
      aggregateId: run.inspectionId,
      aggregateType: 'inspection',
      payload: { aiRunId: run.id, attempt },
      metadata: { correlationId: run.correlationId, queue: AI_INSPECTION_QUEUE },
      tankId: run.inspection.tankId,
      washOrderId: run.washOrderId,
      triggeredByUserId: run.requestedById,
    });

    try {
      const evidence = run.washOrder.evidences.filter((item) => !!item.fileUrl);
      const result = await this.aiService.analyzeInspection({
        inspectionId: run.inspectionId,
        washOrderId: run.washOrderId,
        tank: {
          id: run.inspection.tankId,
          serialNumber: run.washOrder.tank?.serialNumber ?? run.washOrder.tankId,
          isoCode: run.washOrder.tank?.isoCode,
        },
        evidence: evidence.map((item) => ({
          id: item.id,
          fileUrl: item.fileUrl,
          type: item.type,
          comment: item.comment,
        })),
        operationContext: {
          notes: run.washOrder.notes,
        },
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.aiInspectionRun.update({
          where: { id: run.id },
          data: {
            status: AiInspectionRunStatus.COMPLETED,
            score: result.score,
            classification: result.classification as AiClassification,
            summary: result.summary,
            findingsJson: result.findings as unknown as Prisma.InputJsonValue,
            risksJson: result.risks as unknown as Prisma.InputJsonValue,
            rawResponse: result.rawResponse as unknown as Prisma.InputJsonValue,
            finishedAt: new Date(),
          },
        });

        await tx.agentAction.create({
          data: {
            agentType: AgentType.OBSERVADOR,
            actionType: 'inspection_ai_recommendation',
            reasoning: result.summary,
            payload: {
              score: result.score,
              classification: result.classification,
              recommendation: result.recommendation,
              risks: result.risks,
            } as Prisma.InputJsonValue,
            status: AgentActionStatus.PENDING_REVIEW,
            requiresHuman: true,
            washOrderId: run.washOrderId,
            tankId: run.inspection.tankId,
          },
        });

        await this.persistAiFindings(
          tx,
          {
            inspectionId: run.inspectionId,
            washOrderId: run.washOrderId,
            tankId: run.inspection.tankId,
            inspectorId: run.inspection.inspectorId,
          },
          result.findings,
        );

        await tx.washOrder.update({
          where: { id: run.washOrderId },
          data: {
            status: WashOrderStatus.PENDING_CERTIFICATION,
          },
        });

        await tx.inspection.update({
          where: { id: run.inspectionId },
          data: {
            overallResult:
              result.classification === 'APPROVED'
                ? InspectionResult.PASS
                : result.classification === 'MANUAL_REVIEW'
                  ? InspectionResult.PASS_WITH_OBSERVATIONS
                  : InspectionResult.FAIL,
          },
        });
      });

      await this.eventsService.create({
        type: EventType.INSPECTION_AI_COMPLETED,
        aggregateId: run.inspectionId,
        aggregateType: 'inspection',
        payload: {
          aiRunId: run.id,
          score: result.score,
          classification: result.classification,
        },
        metadata: { correlationId: run.correlationId },
        tankId: run.inspection.tankId,
        washOrderId: run.washOrderId,
        triggeredByUserId: run.requestedById,
      });

      await this.eventsService.create({
        type: EventType.INSPECTION_CERTIFICATION_REQUESTED,
        aggregateId: run.inspectionId,
        aggregateType: 'inspection',
        payload: {
          aiRunId: run.id,
          classification: result.classification,
        },
        metadata: { correlationId: run.correlationId },
        tankId: run.inspection.tankId,
        washOrderId: run.washOrderId,
        triggeredByUserId: run.requestedById,
      });
    } catch (error) {
      const maxRetries = Number(this.config.get('AI_MAX_RETRIES') ?? 3);
      const isTerminalFailure = attempt >= maxRetries;
      const message =
        error instanceof Error ? error.message : 'Unknown AI processing error';

      await this.prisma.aiInspectionRun.update({
        where: { id: run.id },
        data: {
          status: isTerminalFailure
            ? AiInspectionRunStatus.FAILED
            : AiInspectionRunStatus.QUEUED,
          errorMessage: message,
          attempts: attempt,
          finishedAt: isTerminalFailure ? new Date() : null,
        },
      });

      if (isTerminalFailure) {
        await this.eventsService.create({
          type: EventType.INSPECTION_AI_FAILED,
          aggregateId: run.inspectionId,
          aggregateType: 'inspection',
          payload: { aiRunId: run.id, error: message, attempts: attempt },
          metadata: { correlationId: run.correlationId },
          tankId: run.inspection.tankId,
          washOrderId: run.washOrderId,
          triggeredByUserId: run.requestedById,
        });
      }

      throw error;
    }
  }

  private async persistAiFindings(
    tx: Prisma.TransactionClient,
    context: {
      inspectionId: string;
      washOrderId: string;
      tankId: string;
      inspectorId: string;
    },
    findings: NormalizedAiFinding[],
  ) {
    for (const item of findings) {
      const existing = await tx.finding.findFirst({
        where: {
          inspectionId: context.inspectionId,
          location: item.location,
          description: item.description,
        },
      });

      if (existing) {
        continue;
      }

      const finding = await tx.finding.create({
        data: {
          tankId: context.tankId,
          washOrderId: context.washOrderId,
          inspectionId: context.inspectionId,
          inspectorId: context.inspectorId,
          itcoZoneCode: item.itcoZoneCode ?? 'UNKNOWN',
          eftcoDamageCode: item.eftcoDamageCode ?? 'UNKNOWN',
          eftcoDamageName: item.eftcoDamageName ?? 'Pending manual classification',
          location: item.location,
          severity: item.severity as FindingSeverity,
          description: item.description,
        },
      });

      if (!item.itcoZoneCode || !item.eftcoDamageCode) {
        await tx.systemQuestion.create({
          data: {
            agentType: AgentType.OBSERVADOR,
            question:
              'La IA detecto un hallazgo sin clasificacion completa. Validar zona ITCO y codigo EFTCO.',
            context: {
              findingId: finding.id,
              inspectionId: context.inspectionId,
              description: item.description,
              location: item.location,
            } as Prisma.InputJsonValue,
            isResolved: false,
            assignedToId: context.inspectorId,
            washOrderId: context.washOrderId,
            tankId: context.tankId,
            findingId: finding.id,
          },
        });
      }
    }
  }
}
