import { IsString, IsInt, IsArray, ValidateNested, IsOptional, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

class WorkOrderItemDto {
  @IsString()
  servicio_nombre: string; // Ej: "Cambio Pastillas", "Rectificado", "Sangrado"

  @IsString()
  @IsOptional()
  descripcion: string; // Comentario manuscrito del mecánico

  @IsInt()
  precio: number; // El monto que se cobró ($)

  @IsString()
  @IsOptional()
  product_sku: string; // (Opcional) Si sacaron un repuesto del inventario

  @IsInt()
  @IsOptional()
  cantidad_producto: number; // Cuántos repuestos usaron (por defecto 1)
}

class ClientDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  rut: string; // Idealmente obligatorio, pero flexible

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  telefono: string;
}

class VehicleDto {
  @IsString()
  patente: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsInt()
  @IsOptional()
  kilometraje: number;
}

export class CreateWorkOrderDto {
  @IsInt()
  numero_orden_papel: number; // El número rojo del talonario (UNIQUE)

  @IsString()
  realizado_por: string; // Nombre del mecánico que realizó el trabajo

  @IsString()
  @IsOptional()
  revisado_por: string; // Firma del supervisor (NUEVO CAMPO)

  @ValidateNested()
  @Type(() => ClientDto)
  cliente: ClientDto;

  @ValidateNested()
  @Type(() => VehicleDto)
  vehiculo: VehicleDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  items: WorkOrderItemDto[];
}
