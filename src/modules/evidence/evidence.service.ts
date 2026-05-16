import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvidenceType } from '@prisma/client';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AI_SUPPORTED_MIME_TYPES } from '../ai/ai.constants';

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async upload(
    file: Express.Multer.File,
    washOrderId: string,
    uploadedById: string,
    type: EvidenceType = EvidenceType.PRE_WASH,
    comment?: string,
  ) {
    const order = await this.prisma.washOrder.findUnique({
      where: { id: washOrderId },
    });
    if (!order) throw new NotFoundException(`WashOrder ${washOrderId} not found`);

    if (!AI_SUPPORTED_MIME_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException(
        `Unsupported file type ${file.mimetype}. Allowed types: ${AI_SUPPORTED_MIME_TYPES.join(', ')}`,
      );
    }

    const fileKey = `evidences/${washOrderId}/${uuidv4()}-${file.originalname}`;
    const bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET');
    let fileUrl = `local://${fileKey}`;
    const fileHash = createHash('sha256').update(file.buffer).digest('hex');

    if (bucket) {
      const { error } = await this.supabase
        .getClient()
        .storage.from(bucket)
        .upload(fileKey, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new InternalServerErrorException(
          `Storage upload failed: ${error.message}`,
        );
      }

      const { data: urlData } = this.supabase
        .getClient()
        .storage.from(bucket)
        .getPublicUrl(fileKey);

      fileUrl = urlData.publicUrl;
    }

    return this.prisma.evidence.create({
      data: {
        fileUrl,
        fileKey,
        type,
        comment,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        hash: fileHash,
        washOrderId,
        uploadedById,
      },
      include: {
        uploadedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async findByOrder(washOrderId: string) {
    return this.prisma.evidence.findMany({
      where: { washOrderId },
      include: {
        uploadedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
