// tanks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateTankDto {
  @IsString() serialNumber: string;
  @IsOptional() @IsString() isoCode?: string;
  @IsOptional() @IsNumber() capacityL?: number;
}

@Injectable()
export class TanksService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTankDto) {
    return this.prisma.isoTank.create({ data: dto });
  }

  findAll() {
    return this.prisma.isoTank.findMany({
      where: { isActive: true },
      orderBy: { serialNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const tank = await this.prisma.isoTank.findUnique({ where: { id } });
    if (!tank) throw new NotFoundException('Tank not found');
    return tank;
  }

  update(id: string, dto: Partial<CreateTankDto>) {
    return this.prisma.isoTank.update({ where: { id }, data: dto });
  }
}
