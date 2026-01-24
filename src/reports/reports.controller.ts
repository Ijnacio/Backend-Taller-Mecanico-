import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('📊 Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('low-stock')
  @ApiOperation({ 
    summary: 'Alerta de stock bajo',
    description: 'Retorna productos donde stock_actual <= stock_minimo. Usar para alertas de recompra.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de productos con stock bajo',
    schema: {
      example: {
        total_alertas: 2,
        fecha_consulta: '2026-01-23T10:30:00.000Z',
        productos: [
          {
            id: 'uuid',
            sku: 'F-002',
            nombre: 'Disco Ventilado',
            marca: 'Brembo',
            stock_actual: 2,
            stock_minimo: 5,
            diferencia: 3,
            categoria: 'Frenos',
            precio_venta: 45000
          }
        ]
      }
    }
  })
  getLowStock() {
    return this.reportsService.getLowStock();
  }

  @Get('daily-cash')
  @ApiOperation({ 
    summary: 'Caja diaria',
    description: `
Retorna el resumen de ingresos del día.

**Incluye:**
- total_taller: Suma de WorkOrders
- total_meson: Suma de CounterSales tipo VENTA
- total_final: Suma de ambos

**Nota:** Solo cuenta CounterSales tipo VENTA, no PERDIDA ni USO_INTERNO.
    ` 
  })
  @ApiQuery({ 
    name: 'fecha', 
    required: false, 
    example: '2026-01-22',
    description: 'Fecha en formato YYYY-MM-DD. Si no se envía, usa la fecha actual.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumen de caja del día',
    schema: {
      example: {
        fecha: '2026-01-23',
        total_taller: 350000,
        cantidad_ordenes: 5,
        total_meson: 85000,
        cantidad_ventas_meson: 3,
        total_final: 435000
      }
    }
  })
  getDailyCash(@Query('fecha') fecha?: string) {
    return this.reportsService.getDailyCash(fecha);
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Buscador global',
    description: `
Busca en múltiples entidades simultáneamente:
- **Clientes:** por nombre o RUT
- **Vehículos:** por patente
- **Órdenes:** por patente del vehículo

Útil para acceso rápido al historial de un cliente.
    ` 
  })
  @ApiQuery({ 
    name: 'q', 
    required: true, 
    example: 'Juan',
    description: 'Texto a buscar (mínimo 2 caracteres)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultados de búsqueda agrupados',
    schema: {
      example: {
        busqueda: 'Juan',
        total_resultados: 5,
        clientes: [
          { id: 'uuid', nombre: 'Juan Pérez', rut: '12345678-9', telefono: '+56912345678' }
        ],
        vehiculos: [],
        ordenes_recientes: [
          { id: 'uuid', numero_orden_papel: 1234, total_cobrado: 85000, fecha: '2026-01-20' }
        ]
      }
    }
  })
  globalSearch(@Query('q') query: string) {
    return this.reportsService.globalSearch(query);
  }
}
