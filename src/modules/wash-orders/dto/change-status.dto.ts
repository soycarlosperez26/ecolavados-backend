import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WashOrderStatus, WashOrderSubStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({ enum: WashOrderStatus })
  @IsEnum(WashOrderStatus)
  status: WashOrderStatus;

  @ApiPropertyOptional({
    description: 'Required when status is REJECTED',
  })
  @ValidateIf((o) => o.status === WashOrderStatus.REJECTED)
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    enum: WashOrderSubStatus,
    description: 'Only valid when transitioning to IN_PROGRESS',
  })
  @IsOptional()
  @IsEnum(WashOrderSubStatus)
  subStatus?: WashOrderSubStatus;
}
