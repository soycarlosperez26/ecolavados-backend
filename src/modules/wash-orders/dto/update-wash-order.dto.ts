// update-wash-order.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateWashOrderDto } from './create-wash-order.dto';

export class UpdateWashOrderDto extends PartialType(CreateWashOrderDto) {}
