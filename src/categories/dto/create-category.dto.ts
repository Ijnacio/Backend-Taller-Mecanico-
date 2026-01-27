import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Frenos',
    description: 'Nombre de la categoría',
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({
    example: 'Repuestos relacionados con el sistema de frenos',
    description: 'Descripción de la categoría',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
