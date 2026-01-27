import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleModelDto {
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
    description: 'Año del modelo (opcional, null = todos los años)',
  })
  @IsInt()
  @Min(1900)
  @IsOptional()
  anio?: number;

  @ApiPropertyOptional({
    example: '1.5L',
    description: 'Motorización (opcional)',
  })
  @IsString()
  @IsOptional()
  motor?: string;
}
