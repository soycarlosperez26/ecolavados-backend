import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssignmentRole, WashOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(washOrderId: string, userId: string, role: AssignmentRole = AssignmentRole.OPERATOR) {
    const [order, user] = await Promise.all([
      this.prisma.washOrder.findUnique({ where: { id: washOrderId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!order) throw new NotFoundException('WashOrder not found');
    if (!user) throw new NotFoundException('User not found');

    // Can only assign operators to orders in APPROVED or REJECTED (reactivation) state
    const assignableStatuses = [WashOrderStatus.APPROVED, WashOrderStatus.REJECTED] as const;
    if (!assignableStatuses.includes(order.status as typeof assignableStatuses[number])) {
      throw new BadRequestException(
        `Cannot assign an operator to an order in status ${order.status}. Order must be APPROVED or REJECTED.`,
      );
    }

    const existing = await this.prisma.washOrderAssignment.findUnique({
      where: { washOrderId_userId_role: { washOrderId, userId, role } },
    });
    if (existing) throw new ConflictException('Already assigned with this role');

    const assignment = await this.prisma.washOrderAssignment.create({
      data: { userId, washOrderId, role },
      include: {
        washOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    // Move order to ASSIGNED status
    await this.prisma.washOrder.update({
      where: { id: washOrderId },
      data: { status: WashOrderStatus.ASSIGNED },
    });

    return assignment;
  }

  async unassign(washOrderId: string, userId: string) {
    const existing = await this.prisma.washOrderAssignment.findFirst({
      where: { washOrderId, userId },
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    await this.prisma.washOrderAssignment.deleteMany({ where: { washOrderId, userId } });

    // If no more assignments remain, revert order to APPROVED
    const remaining = await this.prisma.washOrderAssignment.count({ where: { washOrderId } });
    if (remaining === 0) {
      await this.prisma.washOrder.update({
        where: { id: washOrderId },
        data: { status: WashOrderStatus.APPROVED },
      });
    }

    return { message: 'Operator unassigned successfully' };
  }
}
