import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CounterSalesService } from './counter-sales.service';
import { CreateCounterSaleDto } from './dto/create-counter-sale.dto';
import { MovementType } from './enums/movement-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('💰 Ventas Mostrador')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('counter-sales')
export class CounterSalesController {
  constructor(private readonly counterSalesService: CounterSalesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Registrar movimiento de inventario',
    description: `
Registra salidas de inventario que NO son órdenes de trabajo.

**Tipos de movimiento:**
- **VENTA:** Cliente compra producto sin servicio de instalación. Requiere: comprador, precio_venta.
- **PERDIDA:** Producto dañado, vencido o robado. Solo registra el costo perdido.
- **USO_INTERNO:** Consumo del taller (ej: aceite para herramientas).

**Lógica automática:**
- Descuenta stock del inventario
- Calcula total_venta (para VENTA) o costo_perdida (para PERDIDA)
    ` 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Movimiento registrado exitosamente',
    schema: {
      example: {
        message: 'Movimiento registrado exitosamente',
        id: 'uuid-counter-sale',
        tipo: 'VENTA',
        total_venta: 56000,
        costo_perdida: 0,
        items_procesados: 2
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT requerido' })
  create(@Body() createCounterSaleDto: CreateCounterSaleDto) {
    return this.counterSalesService.create(createCounterSaleDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar movimientos de inventario',
    description: 'Retorna todos los movimientos. Puede filtrar por tipo usando query param.' 
  })
  @ApiQuery({ 
    name: 'tipo', 
    required: false, 
    enum: MovementType,
    description: 'Filtrar por tipo: VENTA, PERDIDA, USO_INTERNO' 
  })
  @ApiResponse({ status: 200, description: 'Lista de movimientos' })
  findAll(@Query('tipo') tipo?: MovementType) {
    if (tipo) {
      return this.counterSalesService.findByType(tipo);
    }
    return this.counterSalesService.findAll();
  }
}
