import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole, WashOrderStatus, WashOrderSubStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWashOrderDto } from './dto/create-wash-order.dto';
import { CreateWashOrderExternalDto } from './dto/create-wash-order-external.dto';
import { UpdateWashOrderDto } from './dto/update-wash-order.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

export interface RequestUser {
  sub: string;
  email: string;
  roles: string[];
}

const STATUS_TRANSITIONS: Record<WashOrderStatus, WashOrderStatus[]> = {
  NEEDS_REVIEW: [WashOrderStatus.APPROVED, WashOrderStatus.REJECTED, WashOrderStatus.CANCELLED],
  APPROVED:     [WashOrderStatus.REJECTED, WashOrderStatus.CANCELLED],
  REJECTED:     [WashOrderStatus.APPROVED, WashOrderStatus.ASSIGNED, WashOrderStatus.CANCELLED],
  ASSIGNED:     [WashOrderStatus.IN_PROGRESS, WashOrderStatus.REJECTED, WashOrderStatus.CANCELLED],
  IN_PROGRESS:  [WashOrderStatus.IN_REVIEW, WashOrderStatus.REJECTED],
  IN_REVIEW:    [WashOrderStatus.COMPLETED, WashOrderStatus.REJECTED],
  COMPLETED:    [],
  CANCELLED:    [],
};

// Transitions that operators are allowed to trigger
const OPERATOR_TRANSITIONS: Partial<Record<WashOrderStatus, WashOrderStatus[]>> = {
  ASSIGNED:    [WashOrderStatus.IN_PROGRESS],
  IN_PROGRESS: [WashOrderStatus.IN_REVIEW],
};

// Statuses where operators can edit order fields
const OPERATOR_EDITABLE_STATUSES: WashOrderStatus[] = [
  WashOrderStatus.ASSIGNED,
  WashOrderStatus.IN_PROGRESS,
  WashOrderStatus.IN_REVIEW,
];

const ADMIN_ROLES: string[] = [UserRole.ADMIN, UserRole.COORDINATOR];

function isAdminOrCoordinator(user: RequestUser): boolean {
  return user.roles.some((r) => ADMIN_ROLES.includes(r));
}

@Injectable()
export class WashOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWashOrderDto) {
    const orderNumber = await this.generateOrderNumber();
    return this.prisma.washOrder.create({
      data: { ...dto, orderNumber, status: WashOrderStatus.APPROVED },
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

  async findAll(user: RequestUser, status?: WashOrderStatus) {
    if (isAdminOrCoordinator(user)) {
      return this.prisma.washOrder.findMany({
        where: status ? { status } : undefined,
        include: { client: true, tank: true, assignments: true, evidences: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Operators only see orders assigned to them; NEEDS_REVIEW is never assigned
    return this.prisma.washOrder.findMany({
      where: {
        status: status ?? { not: WashOrderStatus.NEEDS_REVIEW },
        assignments: { some: { userId: user.sub } },
      },
      include: { client: true, tank: true, assignments: true, evidences: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: RequestUser) {
    const order = await this.prisma.washOrder.findUnique({
      where: { id },
      include: {
        client: true,
        tank: true,
        assignments: true,
        evidences: {
          include: { uploadedBy: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) throw new NotFoundException(`WashOrder ${id} not found`);

    if (!isAdminOrCoordinator(user)) {
      const isAssigned = order.assignments.some((a) => a.userId === user.sub);
      if (!isAssigned) throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async update(id: string, dto: UpdateWashOrderDto, user: RequestUser) {
    const order = await this.findOne(id, user);

    if (!isAdminOrCoordinator(user)) {
      if (!OPERATOR_EDITABLE_STATUSES.includes(order.status)) {
        throw new ForbiddenException(
          'You can only edit orders in ASSIGNED, IN_PROGRESS or IN_REVIEW status',
        );
      }
    }

    return this.prisma.washOrder.update({
      where: { id },
      data: dto,
      include: { client: true, tank: true },
    });
  }

  async changeStatus(id: string, dto: ChangeStatusDto, user: RequestUser) {
    const order = await this.findOne(id, user);
    const allowed = STATUS_TRANSITIONS[order.status];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    if (!isAdminOrCoordinator(user)) {
      const operatorAllowed = OPERATOR_TRANSITIONS[order.status] ?? [];
      if (!operatorAllowed.includes(dto.status)) {
        throw new ForbiddenException(`Operators cannot set status to ${dto.status}`);
      }
    }

    if (dto.status === WashOrderStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('A rejection comment is required when rejecting an order');
    }

    const data: Record<string, unknown> = {
      status: dto.status,
      subStatus: null,
    };

    if (dto.status === WashOrderStatus.IN_PROGRESS) {
      data.startedAt = order.startedAt ?? new Date();
      data.subStatus = dto.subStatus ?? null;
    }
    if (dto.status === WashOrderStatus.COMPLETED) {
      data.completedAt = new Date();
    }
    if (dto.status === WashOrderStatus.REJECTED) {
      data.rejectedAt = new Date();
      data.rejectionReason = dto.rejectionReason;
    }

    return this.prisma.washOrder.update({ where: { id }, data });
  }

  async updateSubStatus(id: string, subStatus: WashOrderSubStatus, user: RequestUser) {
    const order = await this.findOne(id, user);

    if (order.status !== WashOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Sub-status can only be changed on IN_PROGRESS orders');
    }

    return this.prisma.washOrder.update({ where: { id }, data: { subStatus } });
  }

  async remove(id: string, user: RequestUser) {
    if (!isAdminOrCoordinator(user)) {
      throw new ForbiddenException('Only administrators can delete orders');
    }

    const order = await this.findOne(id, user);

    if (order.status === WashOrderStatus.COMPLETED) {
      throw new BadRequestException('Completed orders cannot be deleted');
    }

    return this.prisma.washOrder.delete({ where: { id } });
  }

  async getStats(user: RequestUser) {
    const baseWhere = isAdminOrCoordinator(user)
      ? {}
      : { assignments: { some: { userId: user.sub } } };

    const statuses: WashOrderStatus[] = [
      'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'ASSIGNED',
      'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED',
    ];

    const [total, ...counts] = await Promise.all([
      this.prisma.washOrder.count({ where: baseWhere }),
      ...statuses.map((status) =>
        this.prisma.washOrder.count({ where: { ...baseWhere, status } }),
      ),
    ]);

    return statuses.reduce(
      (acc, key, i) => ({ ...acc, [key.toLowerCase()]: counts[i] }),
      { total } as Record<string, number>,
    );
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
