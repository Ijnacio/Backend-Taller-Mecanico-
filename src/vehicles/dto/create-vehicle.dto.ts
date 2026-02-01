import { IsString, IsInt, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({
    example: 'ABCD12',
    description: 'Patente única del vehículo',
  })
  @IsString()
  patente: string;

  @ApiProperty({
    example: 'Toyota',
    description: 'Marca del vehículo',
  })
  @IsString()
  marca: string;

  @ApiProperty({
    example: 'Yaris',
    description: 'Modelo del vehículo',
  })
  @IsString()
  modelo: string;

  @ApiPropertyOptional({
    example: 2020,
    description: 'Año del vehículo',
  })
  @IsInt()
  @Min(1900)
  @IsOptional()
  anio?: number;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Kilometraje del vehículo',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  kilometraje?: number;

  @ApiPropertyOptional({
    example: 'uuid-cliente',
    description: 'ID del cliente dueño del vehículo',
  })
  @IsUUID()
  @IsOptional()
  clienteId?: string;
}
