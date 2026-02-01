import {
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PurchaseItemDto {
  @ApiProperty({ example: 'F-001', description: 'SKU del producto' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'Pastilla de Freno', description: 'Nombre del producto' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Bosch', description: 'Marca del producto' })
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiPropertyOptional({ example: 'Cerámica', description: 'Calidad del producto' })
  @IsString()
  @IsOptional()
  calidad?: string;

  @ApiPropertyOptional({
    example: ['uuid-modelo-1', 'uuid-modelo-2'],
    description: 'IDs de modelos de vehículos compatibles',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  modelos_compatibles_ids?: string[];

  @ApiProperty({ example: 10, description: 'Cantidad a comprar' })
  @IsInt()
  cantidad: number;

  @ApiProperty({ example: 15000, description: 'Precio de costo unitario en CLP' })
  @IsInt()
  precio_costo: number;
}

export class CreatePurchaseDto {
  @ApiProperty({ example: 'Repuestos Chile', description: 'Nombre del proveedor' })
  @IsString()
  proveedor_nombre: string;

  @ApiPropertyOptional({ example: 'F-12345', description: 'Número de documento/factura' })
  @IsString()
  @IsOptional()
  numero_documento?: string;

  @ApiProperty({
    example: 'FACTURA',
    description: 'Tipo de documento (FACTURA calcula IVA, INFORMAL no)',
    enum: ['FACTURA', 'INFORMAL'],
  })
  @IsString()
  tipo_documento: 'FACTURA' | 'INFORMAL';

  @ApiProperty({ type: [PurchaseItemDto], description: 'Lista de productos a comprar' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
