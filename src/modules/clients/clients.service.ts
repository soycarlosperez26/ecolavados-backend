// clients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional, IsEmail } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateClientDto {
  @IsString() name: string;
  @IsString() companyId: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  findAll() {
    return this.prisma.client.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { washOrders: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  update(id: string, dto: Partial<CreateClientDto>) {
    return this.prisma.client.update({ where: { id }, data: dto });
  }
}
