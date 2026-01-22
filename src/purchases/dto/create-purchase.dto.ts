import { IsString, IsInt, IsArray, ValidateNested, IsOptional, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

// ... imports
class PurchaseItemDto {
  @IsString()
  sku: string;

  @IsString()
  nombre: string; // Nombre para el producto nuevo

  @IsString()
  @IsOptional()
  marca: string;

  @IsString()
  @IsOptional()
  calidad: string;

  @IsArray()
  @IsOptional()
  vehiculos_ids: string[]; // <--- NUEVO: IDs de los autos compatibles (Ej: ["uuid-1", "uuid-2"])

  @IsInt()
  cantidad: number;

  @IsInt()
  precio_costo: number; // Costo real (lo que salió del bolsillo)

  @IsInt()
  precio_venta_sugerido: number;
}

export class CreatePurchaseDto {
  @IsString()
  proveedor_nombre: string;

  @IsString()
  @IsOptional()
  numero_documento: string; // Puede ser Factura o simplemente "Recibo Manual"

  @IsString()
  tipo_documento: 'FACTURA' | 'INFORMAL'; // <--- NUEVO: Para decidir si calculamos IVA

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}