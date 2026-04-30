import { ApiProperty } from '@nestjs/swagger'

export class VerifyOtpSignupDto {
  @ApiProperty({ example: '+855965757009' })
  phone: string

  @ApiProperty({ example: 'mypassword123' })
  password: string

  @ApiProperty({ example: '1234' })
  otp: string
}