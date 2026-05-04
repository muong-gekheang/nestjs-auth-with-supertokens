import { ApiProperty } from '@nestjs/swagger'

export class SigninDto {
  @ApiProperty({ example: '+855965757009' })
  phone: string

  @ApiProperty({ example: 'mypassword123' })
  password: string
}