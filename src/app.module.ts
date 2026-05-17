import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WashOrdersModule } from './modules/wash-orders/wash-orders.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ClientsModule } from './modules/clients/clients.module';
import { TanksModule } from './modules/tanks/tanks.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),
        SUPABASE_URL: Joi.string().uri().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_STORAGE_BUCKET: Joi.string().default('evidences'),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
      }),
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    WashOrdersModule,
    EvidenceModule,
    AssignmentsModule,
    ClientsModule,
    TanksModule,
    EventsModule,
    InspectionsModule,
  ],
})
export class AppModule {}
