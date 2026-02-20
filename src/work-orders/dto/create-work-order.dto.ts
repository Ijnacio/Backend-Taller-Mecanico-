import {
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEmail,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class WorkOrderItemDto {
  @ApiProperty({
    example: 'Cambio Pastillas',
    description:
      'Nombre del servicio realizado (ver /work-orders/services-catalog)',
  })
  @IsString()
  servicio_nombre: string;

  @ApiPropertyOptional({
    example: 'Cambio pastillas delanteras cerámicas marca Bosch',
    description: 'Comentario o detalle adicional del trabajo',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    example: 45000,
    description: 'Monto cobrado por este servicio en pesos (CLP)',
    minimum: 0,
  })
  @IsInt()
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio: number;

  @ApiPropertyOptional({
    example: 'F-001',
    description:
      'SKU del producto usado (si aplica). Descuenta stock automáticamente.',
  })
  @IsString()
  @IsOptional()
  product_sku?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Cantidad de productos usados (default: 1)',
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @IsOptional()
  cantidad_producto?: number;

  // Alias para compatibilidad con frontend
  @ApiPropertyOptional({
    example: 1,
    description: 'Alias de cantidad_producto para compatibilidad',
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @IsOptional()
  cantidad?: number;
}

class ClientDto {
  @ApiProperty({
    example: 'Juan Pérez González',
    description: 'Nombre completo del cliente',
  })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({
    example: '12.345.678-9',
    description: 'RUT del cliente. Se normaliza automáticamente.',
  })
  @IsString()
  @IsOptional()
  rut: string;

  @ApiPropertyOptional({
    example: 'juan.perez@gmail.com',
    description: 'Email del cliente',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    example: '+56912345678',
    description: 'Teléfono de contacto',
  })
  @IsString()
  @IsOptional()
  telefono: string;
}

class VehicleDto {
  @ApiProperty({
    example: 'ABCD12',
    description: 'Patente del vehículo. Se normaliza a mayúsculas.',
  })
  @IsString()
  patente: string;

  @ApiProperty({ example: 'Toyota', description: 'Marca del vehículo' })
  @IsString()
  marca: string;

  @ApiProperty({ example: 'Yaris Sport', description: 'Modelo del vehículo' })
  @IsString()
  modelo: string;

  @ApiPropertyOptional({
    example: 85000,
    description: 'Kilometraje actual del vehículo',
  })
  @IsInt()
  @IsOptional()
  kilometraje: number;
}

export class CreateWorkOrderDto {
  @ApiProperty({
    example: 1547,
    description:
      'Número del talón físico (correlativo del talonario rojo). Debe ser ÚNICO.',
  })
  @IsInt()
  numero_orden_papel: number;

  @ApiProperty({
    example: 'Carlos González',
    description: 'Nombre del mecánico que realizó el trabajo',
  })
  @IsString()
  realizado_por: string;

  @ApiPropertyOptional({
    example: 'Pedro Supervisor',
    description: 'Nombre de quien supervisó/revisó el trabajo',
  })
  @IsString()
  @IsOptional()
  revisado_por: string;

  @ApiPropertyOptional({
    example: '2025-11-15',
    description:
      'Fecha real de la orden (YYYY-MM-DD). OPCIONAL: solo usar si se necesita registrar una orden con fecha distinta a la actual. Si no se envía, se usa la fecha del servidor.',
  })
  @IsDateString()
  @IsOptional()
  fecha_ingreso?: string;

  @ApiProperty({
    description:
      'Datos del cliente. Si el RUT ya existe, se actualiza el registro.',
    type: ClientDto,
  })
  @ValidateNested()
  @Type(() => ClientDto)
  cliente: ClientDto;

  @ApiProperty({
    description: 'Datos del vehículo. Si la patente ya existe, se actualiza.',
    type: VehicleDto,
  })
  @ValidateNested()
  @Type(() => VehicleDto)
  vehiculo: VehicleDto;

  @ApiProperty({
    description:
      'Lista de servicios realizados. Cada item puede tener un producto asociado.',
    type: [WorkOrderItemDto],
    example: [
      {
        servicio_nombre: 'Cambio Pastillas',
        descripcion: 'Pastillas delanteras cerámicas',
        precio: 45000,
        product_sku: 'F-001',
        cantidad_producto: 1,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  items: WorkOrderItemDto[];
}
