// evidence.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { EvidenceType } from '@prisma/client';
import { memoryStorage } from 'multer';
import { EvidenceService } from './evidence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Evidence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wash-orders/:orderId/evidence')
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Body('type') type?: EvidenceType,
    @Body('comment') comment?: string,
  ) {
    return this.service.upload(file, orderId, userId, type, comment);
  }

  @Get()
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(orderId);
  }
}
