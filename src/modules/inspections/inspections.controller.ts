import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { RequestAiAnalysisDto } from './dto/request-ai-analysis.dto';
import { CertifyInspectionDto } from './dto/certify-inspection.dto';
import { InspectionsService } from './inspections.service';

@ApiTags('Inspections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly service: InspectionsService) {}

  @Post('order/:orderId')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Create an inspection linked to a wash order' })
  createForOrder(
    @Param('orderId') orderId: string,
    @Body() dto: CreateInspectionDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.createForOrder(orderId, dto, userId);
  }

  @Get('order/:orderId')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List inspections for a wash order' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(orderId);
  }

  @Get(':inspectionId')
  @ApiOperation({ summary: 'Get inspection detail' })
  findOne(@Param('inspectionId') inspectionId: string) {
    return this.service.findOne(inspectionId);
  }

  @Post(':inspectionId/analyze')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Queue asynchronous AI analysis for an inspection' })
  requestAiAnalysis(
    @Param('inspectionId') inspectionId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: RequestAiAnalysisDto,
  ) {
    return this.service.requestAiAnalysis(inspectionId, userId, dto);
  }

  @Get(':inspectionId/result')
  @ApiOperation({ summary: 'Get latest AI analysis result for an inspection' })
  getAiAnalysisResult(@Param('inspectionId') inspectionId: string) {
    return this.service.getAiAnalysisResult(inspectionId);
  }

  @Post(':inspectionId/certify')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Human final certification for an inspection' })
  certifyInspection(
    @Param('inspectionId') inspectionId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CertifyInspectionDto,
  ) {
    return this.service.certifyInspection(inspectionId, userId, dto);
  }
}
