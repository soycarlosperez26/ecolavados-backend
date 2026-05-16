import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiInspectionAnalysisResult,
  AiInspectionClassification,
  AiInspectionInput,
  AiFindingSeverity,
  NormalizedAiFinding,
} from './interfaces/ai-inspection-result.interface';
import { buildTankInspectionPrompt } from './prompts/tank-inspection.prompt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async analyzeInspection(
    input: AiInspectionInput,
  ): Promise<AiInspectionAnalysisResult> {
    if (this.config.get<boolean>('AI_MOCK_MODE')) {
      return this.runMockAnalysis(input);
    }

    if (!this.client) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY is required when AI_MOCK_MODE is disabled',
      );
    }

    const prompt = buildTankInspectionPrompt({
      tankSerial: input.tank.serialNumber,
      isoCode: input.tank.isoCode,
      operationType: input.operationContext?.serviceType,
      evidenceCount: input.evidence.length,
    });

    const payload = {
      model: this.config.get<string>('OPENAI_VISION_MODEL') || 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  inspectionId: input.inspectionId,
                  washOrderId: input.washOrderId,
                  tank: input.tank,
                  operationContext: input.operationContext,
                  evidence: input.evidence.map((item) => ({
                    id: item.id,
                    type: item.type,
                    comment: item.comment ?? null,
                  })),
                },
                null,
                2,
              ),
            },
            ...input.evidence.map((item) => ({
              type: 'image_url',
              image_url: {
                url: item.fileUrl,
              },
            })),
          ],
        },
      ],
    } as any;

    const timeoutMs = Number(this.config.get('AI_TIMEOUT_MS') ?? 120000);
    const completion = (await Promise.race([
      this.client.chat.completions.create(payload),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI timeout exceeded')), timeoutMs),
      ),
    ])) as any;

    const rawContent = completion?.choices?.[0]?.message?.content;

    if (!rawContent || typeof rawContent !== 'string') {
      this.logger.error('OpenAI returned an empty response', completion);
      throw new InternalServerErrorException('OpenAI returned an empty response');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      this.logger.error(`Invalid JSON from OpenAI: ${rawContent}`);
      throw new InternalServerErrorException(
        'OpenAI response was not valid JSON',
      );
    }

    return this.normalizeResult(parsed, completion);
  }

  private runMockAnalysis(
    input: AiInspectionInput,
  ): AiInspectionAnalysisResult {
    const score = Math.max(55, Math.min(95, 55 + input.evidence.length * 8));
    const classification = this.scoreToClassification(score);
    const findings: NormalizedAiFinding[] =
      classification === 'APPROVED'
        ? []
        : [
            {
              itcoZoneCode: score < 70 ? 'Z03' : undefined,
              eftcoDamageCode: score < 70 ? 'D01' : undefined,
              eftcoDamageName: score < 70 ? 'Residuo visible' : undefined,
              severity: score < 70 ? 'HIGH' : 'MEDIUM',
              description:
                score < 70
                  ? 'Se observan residuos y posible corrosion localizada.'
                  : 'Se recomienda validar visualmente residuos leves antes de certificar.',
              location: score < 70 ? 'Manlid y pared interna' : 'Zona interna por validar',
              evidenceIds: input.evidence.slice(0, 2).map((item) => item.id),
            },
          ];

    return {
      score,
      classification,
      summary:
        classification === 'APPROVED'
          ? 'Las evidencias no muestran hallazgos criticos visibles.'
          : 'La inspeccion automatica detecta elementos que requieren revision humana.',
      findings,
      risks:
        classification === 'APPROVED'
          ? []
          : ['Validar manualmente limpieza interna y posibles residuos.'],
      recommendation:
        classification === 'APPROVED'
          ? 'Proceder a certificacion humana final.'
          : 'Bloquear cierre automatico y revisar hallazgos con inspector.',
      rawResponse: {
        provider: 'mock',
        evidenceCount: input.evidence.length,
      },
    };
  }

  private normalizeResult(
    parsed: any,
    rawResponse: unknown,
  ): AiInspectionAnalysisResult {
    const score = this.normalizeScore(parsed?.score);
    const findings = Array.isArray(parsed?.findings)
      ? parsed.findings.map((item: any) => this.normalizeFinding(item))
      : [];

    return {
      score,
      classification: this.normalizeClassification(parsed?.classification, score),
      summary:
        typeof parsed?.summary === 'string' && parsed.summary.trim().length > 0
          ? parsed.summary.trim()
          : 'Analisis generado por IA sin resumen detallado.',
      findings,
      risks: this.toStringArray(parsed?.risks),
      recommendation:
        typeof parsed?.recommendation === 'string' &&
        parsed.recommendation.trim().length > 0
          ? parsed.recommendation.trim()
          : 'Revisar manualmente el resultado antes de certificar.',
      rawResponse,
    };
  }

  private normalizeFinding(item: any): NormalizedAiFinding {
    return {
      itcoZoneCode:
        typeof item?.itcoZoneCode === 'string' && item.itcoZoneCode.trim()
          ? item.itcoZoneCode.trim()
          : undefined,
      eftcoDamageCode:
        typeof item?.eftcoDamageCode === 'string' && item.eftcoDamageCode.trim()
          ? item.eftcoDamageCode.trim()
          : undefined,
      eftcoDamageName:
        typeof item?.eftcoDamageName === 'string' && item.eftcoDamageName.trim()
          ? item.eftcoDamageName.trim()
          : undefined,
      severity: this.normalizeSeverity(item?.severity),
      description:
        typeof item?.description === 'string' && item.description.trim()
          ? item.description.trim()
          : 'Hallazgo detectado por IA sin descripcion detallada.',
      location:
        typeof item?.location === 'string' && item.location.trim()
          ? item.location.trim()
          : 'Ubicacion por validar',
      evidenceIds: this.toStringArray(item?.evidenceIds),
    };
  }

  private normalizeScore(value: unknown) {
    const score = Number(value);
    if (Number.isNaN(score)) return 0;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private normalizeClassification(
    value: unknown,
    score: number,
  ): AiInspectionClassification {
    if (
      value === 'APPROVED' ||
      value === 'MANUAL_REVIEW' ||
      value === 'REJECTED'
    ) {
      return value;
    }

    return this.scoreToClassification(score);
  }

  private scoreToClassification(score: number): AiInspectionClassification {
    if (score >= 90) return 'APPROVED';
    if (score >= 70) return 'MANUAL_REVIEW';
    return 'REJECTED';
  }

  private normalizeSeverity(value: unknown): AiFindingSeverity {
    if (
      value === 'LOW' ||
      value === 'MEDIUM' ||
      value === 'HIGH' ||
      value === 'CRITICAL'
    ) {
      return value;
    }

    return 'MEDIUM';
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
