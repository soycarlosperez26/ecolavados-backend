// assignments.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { AssignmentRole } from '@prisma/client';
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

    if (['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED'].includes(order.status)) {
      await this.prisma.washOrder.update({
        where: { id: washOrderId },
        data: { status: 'ASSIGNED' },
      });
    }

    return assignment;
  }

  async unassign(washOrderId: string, userId: string) {
    const existing = await this.prisma.washOrderAssignment.findFirst({
      where: { washOrderId, userId },
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    return this.prisma.washOrderAssignment.deleteMany({
      where: { washOrderId, userId },
    });
  }
}
