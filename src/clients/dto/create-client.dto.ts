import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del cliente',
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({
    example: '12.345.678-9',
    description: 'RUT del cliente (opcional si es venta rápida). Se normaliza.',
  })
  @IsOptional()
  @IsString()
  rut?: string;

  @ApiPropertyOptional({
    example: 'cliente@email.com',
    description: 'Correo electrónico de contacto',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: '+56912345678',
    description: 'Número de teléfono',
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    example: 'Av. Siempre Viva 123',
    description: 'Dirección física del cliente',
  })
  @IsOptional()
  @IsString()
  direccion?: string;
}
