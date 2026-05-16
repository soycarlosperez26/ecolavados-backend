import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
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
import { AiModule } from './modules/ai/ai.module';
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
        PORT: Joi.number().default(3001),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').optional(),
        REDIS_DB: Joi.number().default(0),
        OPENAI_API_KEY: Joi.string().allow('').optional(),
        OPENAI_VISION_MODEL: Joi.string().default('gpt-4.1-mini'),
        AI_MOCK_MODE: Joi.boolean().truthy('true').truthy('1').falsy('false').falsy('0').default(true),
        AI_MAX_IMAGES_PER_JOB: Joi.number().integer().min(1).default(12),
        AI_MIN_IMAGES_REQUIRED: Joi.number().integer().min(1).default(3),
        AI_TIMEOUT_MS: Joi.number().integer().min(1000).default(120000),
        AI_MAX_RETRIES: Joi.number().integer().min(1).default(3),
        AI_RETRY_BACKOFF_MS: Joi.number().integer().min(100).default(5000),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: Number(config.get<number>('REDIS_PORT') ?? 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(config.get<number>('REDIS_DB') ?? 0),
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
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
    AiModule,
    InspectionsModule,
  ],
})
export class AppModule {}
