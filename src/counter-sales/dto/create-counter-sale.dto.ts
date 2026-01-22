import { IsString, IsArray, ValidateNested, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '../enums/movement-type.enum';

class CounterSaleItemDto {
  @IsString()
  sku: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  precio_venta?: number; // Solo requerido si tipo_movimiento = 'VENTA'
}

export class CreateCounterSaleDto {
  @IsEnum(MovementType)
  tipo_movimiento: MovementType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterSaleItemDto)
  items: CounterSaleItemDto[];

  @IsString()
  @IsOptional()
  comentario?: string; // Ej: "Se rompió al abrir la caja"

  @IsString()
  @IsOptional()
  comprador?: string; // Solo para VENTA: Nombre del vecino/cliente
}
