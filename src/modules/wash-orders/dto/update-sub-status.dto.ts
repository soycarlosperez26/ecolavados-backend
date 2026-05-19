import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WashOrderSubStatus } from '@prisma/client';

export class UpdateSubStatusDto {
  @ApiProperty({ enum: WashOrderSubStatus })
  @IsEnum(WashOrderSubStatus)
  subStatus: WashOrderSubStatus;
}
