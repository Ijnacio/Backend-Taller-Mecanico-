import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProviderDto {
  @ApiProperty({
    example: 'Repuestos Don Gato',
    description: 'Nombre del proveedor',
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({
    example: '+56912345678',
    description: 'Teléfono de contacto',
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    example: 'contacto@repuestos.cl',
    description: 'Email de contacto',
  })
  @IsString()
  @IsOptional()
  email?: string;
}
