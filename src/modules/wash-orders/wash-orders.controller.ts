import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { WashOrderStatus, UserRole } from '@prisma/client';
import { WashOrdersService } from './wash-orders.service';
import { CreateWashOrderDto } from './dto/create-wash-order.dto';
import { UpdateWashOrderDto } from './dto/update-wash-order.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Wash Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wash-orders')
export class WashOrdersController {
  constructor(private readonly service: WashOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  create(@Body() dto: CreateWashOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'status', enum: WashOrderStatus, required: false })
  findAll(@Query('status') status?: WashOrderStatus) {
    return this.service.findAll(status);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  update(@Param('id') id: string, @Body() dto: UpdateWashOrderDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.service.changeStatus(id, dto);
  }
}

@ApiTags('Wash Orders (External)')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('wash-orders/external')
export class WashOrdersExternalController {
  constructor(private readonly service: WashOrdersService) {}

  @Post()
  create(@Body() dto: CreateWashOrderDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWashOrderDto) {
    return this.service.update(id, dto);
  }
}
