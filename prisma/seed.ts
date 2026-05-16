import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as ws from 'ws';

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws as any },
  },
);

async function createAuthUser(email: string, password: string) {
  // Si ya existe en Supabase Auth, lo reutilizamos
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = (list?.users ?? []).find((u: any) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(`Supabase Auth error for ${email}: ${error.message}`);
  return data.user.id;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Demo company ─────────────────────────────────
  const company = await prisma.company.upsert({
    where: { nit: '900123456-1' },
    update: {},
    create: {
      nit: '900123456-1',
      name: 'IsoWash S.A.S',
      shortName: 'IsoWash',
    },
  });

  // ─── Users (Supabase Auth + Prisma) ───────────────
  const usersData = [
    { email: 'admin@isowash.com',     password: 'Admin123!',  fullName: 'Administrador',   role: UserRole.ADMIN },
    { email: 'coord@isowash.com',     password: 'Coord123!',  fullName: 'Coordinador Demo', role: UserRole.COORDINATOR },
    { email: 'operator@isowash.com',  password: 'Oper123!',   fullName: 'Operador Demo',    role: UserRole.OPERATOR },
    { email: 'inspector@isowash.com', password: 'Insp123!',   fullName: 'Inspector Demo',   role: UserRole.INSPECTOR },
  ];

  const createdUsers: { id: string; role: UserRole }[] = [];

  for (const u of usersData) {
    const supabaseUid = await createAuthUser(u.email, u.password);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { supabaseUid },
      create: { email: u.email, fullName: u.fullName, supabaseUid },
    });

    createdUsers.push({ id: user.id, role: u.role });
  }

  // ─── Asignar roles ────────────────────────────────
  for (const { id: userId, role } of createdUsers) {
    await prisma.userCompanyRole.upsert({
      where: { userId_companyId_role: { userId, companyId: company.id, role } },
      update: {},
      create: { userId, companyId: company.id, role },
    });
  }

  // ─── Demo client ──────────────────────────────────
  const client = await prisma.client.upsert({
    where: { taxId: '800987654-3' },
    update: {},
    create: {
      name: 'Petrolatina S.A.S',
      taxId: '800987654-3',
      email: 'cliente@demo.com',
      phone: '+573001234567',
      address: 'Zona Franca Cartagena',
      companyId: company.id,
    },
  });

  // ─── Demo ISO tanks ───────────────────────────────
  const tank1 = await prisma.isoTank.upsert({
    where: { serialNumber: 'ISO-001' },
    update: {},
    create: { serialNumber: 'ISO-001', isoCode: 'T14', capacityL: 24000 },
  });

  await prisma.isoTank.upsert({
    where: { serialNumber: 'ISO-002' },
    update: {},
    create: { serialNumber: 'ISO-002', isoCode: 'T11', capacityL: 20000 },
  });

  // ─── Demo wash order ──────────────────────────────
  await prisma.washOrder.upsert({
    where: { orderNumber: 'WO-202505-0001' },
    update: {},
    create: {
      orderNumber: 'WO-202505-0001',
      description: 'Lavado general ISO Tank — producto anterior: Metanol',
      notes: 'Requiere certificado ATEX',
      companyId: company.id,
      clientId: client.id,
      tankId: tank1.id,
    },
  });

  console.log('\n✅ Seed completado\n');
  console.log('🏢 Empresa: IsoWash S.A.S (NIT: 900123456-1)');
  console.log('\n👤 Usuarios creados en Supabase Auth + BD:');
  console.log('   admin@isowash.com     / Admin123!   → ADMIN');
  console.log('   coord@isowash.com     / Coord123!   → COORDINATOR');
  console.log('   operator@isowash.com  / Oper123!    → OPERATOR');
  console.log('   inspector@isowash.com / Insp123!    → INSPECTOR');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
