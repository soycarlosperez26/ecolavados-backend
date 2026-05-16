export type AiFindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AiInspectionClassification =
  | 'APPROVED'
  | 'MANUAL_REVIEW'
  | 'REJECTED';

export interface AiInspectionEvidenceInput {
  id: string;
  fileUrl: string;
  type: string;
  comment?: string | null;
}

export interface AiInspectionInput {
  inspectionId: string;
  washOrderId: string;
  tank: {
    id: string;
    serialNumber: string;
    isoCode?: string | null;
  };
  evidence: AiInspectionEvidenceInput[];
  operationContext?: {
    serviceType?: string | null;
    notes?: string | null;
  };
}

export interface NormalizedAiFinding {
  itcoZoneCode?: string;
  eftcoDamageCode?: string;
  eftcoDamageName?: string;
  severity: AiFindingSeverity;
  description: string;
  location: string;
  evidenceIds: string[];
}

export interface AiInspectionAnalysisResult {
  score: number;
  classification: AiInspectionClassification;
  summary: string;
  findings: NormalizedAiFinding[];
  risks: string[];
  recommendation: string;
  rawResponse: unknown;
}

export interface AiInspectionJobPayload {
  aiRunId: string;
  correlationId: string;
}
