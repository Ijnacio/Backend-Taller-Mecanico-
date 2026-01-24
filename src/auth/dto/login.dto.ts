import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: '11.111.111-1',
    description: 'RUT del usuario. Acepta con o sin puntos/guiones.',
  })
  @IsString()
  rut: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
