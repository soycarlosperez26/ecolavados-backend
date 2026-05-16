// tanks.controller.ts
import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TanksService, CreateTankDto } from './tanks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tanks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tanks')
export class TanksController {
  constructor(private readonly service: TanksService) {}

  @Post() create(@Body() dto: CreateTankDto) { return this.service.create(dto); }
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: Partial<CreateTankDto>) {
    return this.service.update(id, dto);
  }
}
