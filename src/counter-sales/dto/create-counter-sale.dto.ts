import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../enums/movement-type.enum';

class CounterSaleItemDto {
  @ApiProperty({ example: 'F-001', description: 'SKU del producto a mover' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 2, description: 'Cantidad de unidades', minimum: 1 })
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({
    example: 28000,
    description:
      'Precio de venta unitario. OBLIGATORIO solo si tipo_movimiento = VENTA',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  precio_venta?: number;
}

export class CreateCounterSaleDto {
  @ApiProperty({
    enum: MovementType,
    example: 'VENTA',
    description:
      'Tipo de movimiento: VENTA (cliente compra), PERDIDA (producto dañado), USO_INTERNO (consumo taller)',
  })
  @IsEnum(MovementType)
  tipo_movimiento: MovementType;

  @ApiProperty({
    description: 'Lista de productos a mover',
    type: [CounterSaleItemDto],
    example: [{ sku: 'F-001', cantidad: 2, precio_venta: 28000 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterSaleItemDto)
  items: CounterSaleItemDto[];

  @ApiPropertyOptional({
    example: 'Cliente compró sin instalación',
    description: 'Comentario o motivo del movimiento',
  })
  @IsString()
  @IsOptional()
  comentario?: string;

  @ApiPropertyOptional({
    example: 'Juan Vendedor',
    description:
      'Nombre del vendedor. OBLIGATORIO solo si tipo_movimiento = VENTA',
  })
  @IsString()
  @IsOptional()
  vendedor?: string;
}
