import { IsString, IsInt, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ 
    example: 'F-001', 
    description: 'Código SKU único del producto (identificador interno)' 
  })
  @IsString()
  sku: string;

  @ApiProperty({ 
    example: 'Pastilla de Freno Delantera', 
    description: 'Nombre descriptivo del producto' 
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ 
    example: 'Bosch', 
    description: 'Marca del fabricante' 
  })
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiPropertyOptional({ 
    example: 'Cerámica', 
    description: 'Tipo o calidad del producto (Cerámica, Semimetálica, etc.)' 
  })
  @IsString()
  @IsOptional()
  calidad?: string;

  @ApiProperty({ 
    example: 28000, 
    description: 'Precio de venta al público en CLP',
    minimum: 0
  })
  @IsInt()
  @Min(0, { message: 'El precio de venta debe ser mayor o igual a 0' })
  precio_venta: number;

  @ApiPropertyOptional({ 
    example: 10, 
    description: 'Stock inicial del producto',
    minimum: 0,
    default: 0
  })
  @IsInt()
  @Min(0, { message: 'El stock no puede ser negativo' })
  @IsOptional()
  stock_actual?: number;

  @ApiPropertyOptional({ 
    example: 5, 
    description: 'Stock mínimo para alerta de recompra',
    minimum: 0,
    default: 5
  })
  @IsInt()
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @IsOptional()
  stock_minimo?: number;

  @ApiPropertyOptional({ 
    example: 'uuid-categoria', 
    description: 'ID de la categoría del producto' 
  })
  @IsUUID()
  @IsOptional()
  categoriaId?: string;
}
