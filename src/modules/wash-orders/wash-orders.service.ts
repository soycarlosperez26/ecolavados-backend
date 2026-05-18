import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WashOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWashOrderDto } from './dto/create-wash-order.dto';
import { CreateWashOrderExternalDto } from './dto/create-wash-order-external.dto';
import { UpdateWashOrderDto } from './dto/update-wash-order.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

const STATUS_TRANSITIONS: Record<WashOrderStatus, WashOrderStatus[]> = {
  NEEDS_REVIEW: [
    WashOrderStatus.PENDING,
    WashOrderStatus.CANCELLED,
  ],
  PENDING: [
    WashOrderStatus.PENDING_APPROVAL,
    WashOrderStatus.SCHEDULED,
    WashOrderStatus.ASSIGNED,
    WashOrderStatus.REJECTED,
    WashOrderStatus.CANCELLED,
  ],
  PENDING_APPROVAL: [
    WashOrderStatus.APPROVED,
    WashOrderStatus.REJECTED_PENDING_INFO,
    WashOrderStatus.CANCELLED,
  ],
  REJECTED_PENDING_INFO: [
    WashOrderStatus.PENDING_APPROVAL,
    WashOrderStatus.CANCELLED,
  ],
  APPROVED: [
    WashOrderStatus.SCHEDULED,
    WashOrderStatus.ASSIGNED,
    WashOrderStatus.CANCELLED,
  ],
  SCHEDULED: [WashOrderStatus.ASSIGNED, WashOrderStatus.CANCELLED],
  ASSIGNED: [
    WashOrderStatus.IN_PROGRESS,
    WashOrderStatus.PREPARATION,
    WashOrderStatus.REJECTED,
    WashOrderStatus.CANCELLED,
  ],
  IN_PROGRESS: [
    WashOrderStatus.PREPARATION,
    WashOrderStatus.CLEANING,
    WashOrderStatus.DRYING,
    WashOrderStatus.PRE_INSPECTION,
    WashOrderStatus.PNEUMATIC_TEST,
    WashOrderStatus.WAITING_QI,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  PREPARATION: [
    WashOrderStatus.CLEANING,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  CLEANING: [
    WashOrderStatus.DRYING,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  DRYING: [
    WashOrderStatus.PRE_INSPECTION,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  PRE_INSPECTION: [
    WashOrderStatus.IA_REVIEW,
    WashOrderStatus.PENDING_CERTIFICATION,
    WashOrderStatus.WAITING_QI,
    WashOrderStatus.BLOCKED,
  ],
  IA_REVIEW: [
    WashOrderStatus.PENDING_CERTIFICATION,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  PENDING_CERTIFICATION: [
    WashOrderStatus.COMPLETED,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  PNEUMATIC_TEST: [
    WashOrderStatus.WAITING_QI,
    WashOrderStatus.PRE_INSPECTION,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  WAITING_QI: [
    WashOrderStatus.PRE_INSPECTION,
    WashOrderStatus.PENDING_CERTIFICATION,
    WashOrderStatus.COMPLETED,
    WashOrderStatus.BLOCKED,
    WashOrderStatus.REJECTED,
  ],
  COMPLETED: [],
  BLOCKED: [WashOrderStatus.IN_PROGRESS, WashOrderStatus.REJECTED, WashOrderStatus.CANCELLED],
  REJECTED: [],
  CANCELLED: [],
};

@Injectable()
export class WashOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWashOrderDto) {
    const orderNumber = await this.generateOrderNumber();
    return this.prisma.washOrder.create({
      data: { ...dto, orderNumber },
      include: { client: true, tank: true, assignments: true },
    });
  }

  async createFromExternal(dto: CreateWashOrderExternalDto) {
    const orderNumber = await this.generateOrderNumber();
    return this.prisma.washOrder.create({
      data: { ...dto, orderNumber, status: WashOrderStatus.NEEDS_REVIEW },
      include: { client: true, tank: true, assignments: true },
    });
  }

  async findAll(status?: WashOrderStatus) {
    return this.prisma.washOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        client: true,
        tank: true,
        assignments: true,
        evidences: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.washOrder.findUnique({
      where: { id },
      include: {
        client: true,
        tank: true,
        assignments: true,
        evidences: {
          include: {
            uploadedBy: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!order) throw new NotFoundException(`WashOrder ${id} not found`);
    return order;
  }

  async update(id: string, dto: UpdateWashOrderDto) {
    await this.findOne(id);
    return this.prisma.washOrder.update({
      where: { id },
      data: dto,
      include: { client: true, tank: true },
    });
  }

  async changeStatus(id: string, dto: ChangeStatusDto) {
    const order = await this.findOne(id);
    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const data: any = { status: dto.status };
    if (dto.status === WashOrderStatus.IN_PROGRESS) data.startedAt = new Date();
    if (dto.status === WashOrderStatus.COMPLETED) data.completedAt = new Date();
    if (dto.status === WashOrderStatus.REJECTED) {
      data.rejectedAt = new Date();
      data.rejectionReason = dto.rejectionReason;
    }
    if (dto.status === WashOrderStatus.REJECTED_PENDING_INFO) {
      data.rejectedAt = new Date();
      data.rejectionReason = dto.rejectionReason;
    }

    return this.prisma.washOrder.update({ where: { id }, data });
  }

  async getStats() {
    const [total, pending, inProgress, completed, rejected] = await Promise.all([
      this.prisma.washOrder.count(),
      this.prisma.washOrder.count({ where: { status: 'PENDING' } }),
      this.prisma.washOrder.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.washOrder.count({ where: { status: 'COMPLETED' } }),
      this.prisma.washOrder.count({ where: { status: 'REJECTED' } }),
    ]);
    return { total, pending, inProgress, completed, rejected };
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `WO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.washOrder.count({
      where: { orderNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}
