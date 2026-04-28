import { PartialType } from '@nestjs/swagger';
import { CreateSuperTokenDto } from './create-super-token.dto';

export class UpdateSuperTokenDto extends PartialType(CreateSuperTokenDto) {}
