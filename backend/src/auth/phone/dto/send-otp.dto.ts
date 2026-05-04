import { ApiProperty } from '@nestjs/swagger'

export class SendOtpDto {
  @ApiProperty({ example: '+855965757009' })
  phone: string
}