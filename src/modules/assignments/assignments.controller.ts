// assignments.controller.ts
import { Controller, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentRole, UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

export class AssignOperatorDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(AssignmentRole)
  role?: AssignmentRole;
}

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COORDINATOR)
@Controller('wash-orders/:orderId/assignments')
export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  @Post()
  assign(@Param('orderId') orderId: string, @Body() dto: AssignOperatorDto) {
    return this.service.assign(orderId, dto.userId, dto.role);
  }

  @Delete(':userId')
  unassign(@Param('orderId') orderId: string, @Param('userId') userId: string) {
    return this.service.unassign(orderId, userId);
  }
}
