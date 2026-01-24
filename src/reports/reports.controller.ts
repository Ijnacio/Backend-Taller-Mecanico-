import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
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
    summary: 'Obtener productos con stock bajo (alerta de recompra)',
    description:
      'Retorna productos donde stock_actual <= stock_minimo. Útil para generar alertas de recompra y mantener inventario óptimo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos con stock bajo retornada exitosamente',
    schema: {
      example: {
        total_alertas: 2,
        fecha_consulta: '2026-01-24T10:30:00.000Z',
        productos: [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            sku: 'F-002',
            nombre: 'Disco Ventilado',
            marca: 'Brembo',
            stock_actual: 2,
            stock_minimo: 5,
            diferencia: 3,
            categoria: 'Frenos',
            precio_venta: 45000,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido',
  })
  getLowStock() {
    return this.reportsService.getLowStock();
  }

  @Get('daily-cash')
  @ApiOperation({
    summary: 'Obtener resumen de caja diaria',
    description: `
Retorna el resumen de ingresos del día especificado o del día actual.

**Cálculo de totales:**
- **total_taller:** Suma de todas las WorkOrders del día
- **total_meson:** Suma de CounterSales tipo VENTA únicamente
- **total_final:** total_taller + total_meson

**Importante:** Las PERDIDAS y USO_INTERNO no suman a la caja, solo las VENTAS.
    `,
  })
  @ApiQuery({
    name: 'fecha',
    required: false,
    example: '2026-01-24',
    description:
      'Fecha en formato YYYY-MM-DD. Si no se envía, usa la fecha actual del servidor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de caja del día retornado exitosamente',
    schema: {
      example: {
        fecha: '2026-01-24',
        total_taller: 350000,
        cantidad_ordenes: 5,
        total_meson: 85000,
        cantidad_ventas_meson: 3,
        total_final: 435000,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Formato de fecha inválido',
    schema: {
      example: {
        statusCode: 400,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido',
  })
  getDailyCash(@Query('fecha') fecha?: string) {
    return this.reportsService.getDailyCash(fecha);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Buscador global de clientes, vehículos y órdenes',
    description: `
Busca en múltiples entidades simultáneamente:
- **Clientes:** por nombre o RUT
- **Vehículos:** por patente
- **Órdenes:** por patente del vehículo asociado

Útil para acceso rápido al historial de un cliente o vehículo.
    `,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'Juan',
    description:
      'Texto a buscar (mínimo 2 caracteres). Busca en nombres, RUT y patentes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda agrupados por entidad',
    schema: {
      example: {
        busqueda: 'Juan',
        total_resultados: 5,
        clientes: [
          {
            id: 'uuid',
            nombre: 'Juan Pérez',
            rut: '12345678-9',
            telefono: '+56912345678',
          },
        ],
        vehiculos: [],
        ordenes_recientes: [
          {
            id: 'uuid',
            numero_orden_papel: 1234,
            total_cobrado: 85000,
            fecha: '2026-01-20',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Query muy corta o vacía',
    schema: {
      example: {
        statusCode: 400,
        message: 'La búsqueda debe tener al menos 2 caracteres',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido',
  })
  globalSearch(@Query('q') query: string) {
    return this.reportsService.globalSearch(query);
  }
}
