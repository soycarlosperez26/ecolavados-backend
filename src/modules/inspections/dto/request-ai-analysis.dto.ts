import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class RequestAiAnalysisDto {
  @ApiPropertyOptional({
    description: 'Force a new run even if another completed run exists for the same evidence hash.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
