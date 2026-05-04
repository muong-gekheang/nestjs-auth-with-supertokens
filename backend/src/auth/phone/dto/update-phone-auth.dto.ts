import { PartialType } from '@nestjs/swagger';
import { CreatePhoneAuthDto } from './create-phone-auth.dto';

export class UpdatePhoneAuthDto extends PartialType(CreatePhoneAuthDto) {}
