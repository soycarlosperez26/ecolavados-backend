import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { WashOrderStatus, UserRole } from '@prisma/client';
import { WashOrdersService } from './wash-orders.service';
import { CreateWashOrderDto } from './dto/create-wash-order.dto';
import { CreateWashOrderExternalDto } from './dto/create-wash-order-external.dto';
import { UpdateWashOrderDto } from './dto/update-wash-order.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UpdateSubStatusDto } from './dto/update-sub-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
  findAll(@CurrentUser() user: any, @Query('status') status?: WashOrderStatus) {
    return this.service.findAll(user, status);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWashOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.changeStatus(id, dto, user);
  }

  @Patch(':id/sub-status')
  updateSubStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateSubStatus(id, dto.subStatus, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}

@ApiTags('Wash Orders (External)')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('wash-orders/external')
export class WashOrdersExternalController {
  constructor(private readonly service: WashOrdersService) {}

  @Post()
  create(@Body() dto: CreateWashOrderExternalDto) {
    return this.service.createFromExternal(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWashOrderDto) {
    return this.service.update(id, dto, { sub: 'external', email: '', roles: ['ADMIN'] });
  }
}
