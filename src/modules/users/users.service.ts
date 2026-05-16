import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  isActive: true,
  createdAt: true,
  companyRoles: { select: { role: true, companyId: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const { role, companyId, password, ...rest } = dto;

    const { data: supabaseData, error } = await this.supabase
      .getClient()
      .auth.admin.createUser({
        email: dto.email,
        password,
        email_confirm: true,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Supabase Auth error: ${error.message}`,
      );
    }

    const user = await this.prisma.user.create({
      data: { ...rest, supabaseUid: supabaseData.user.id },
      select: USER_SELECT,
    });

    if (role && companyId) {
      await this.prisma.userCompanyRole.create({
        data: { userId: user.id, companyId, role },
      });
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { companyRoles: { select: { role: true, companyId: true } } },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { companyRoles: { select: { role: true, companyId: true } } },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOrFail(id);
    const { role, companyId, password, ...rest } = dto as any;

    if (password && user.supabaseUid) {
      const { error } = await this.supabase
        .getClient()
        .auth.admin.updateUserById(user.supabaseUid, { password });

      if (error) {
        throw new InternalServerErrorException(
          `Supabase Auth error: ${error.message}`,
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: rest,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    const user = await this.findOrFail(id);

    if (user.supabaseUid) {
      await this.supabase
        .getClient()
        .auth.admin.updateUserById(user.supabaseUid, {
          ban_duration: 'none',
        });
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null) {
    const hashed = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken: hashed },
    });
  }

  private async findOrFail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
