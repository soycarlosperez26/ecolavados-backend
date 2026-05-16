import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WashOrderStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({ enum: WashOrderStatus })
  @IsEnum(WashOrderStatus)
  status: WashOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
