import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CounterSalesService } from './counter-sales.service';
import { CreateCounterSaleDto } from './dto/create-counter-sale.dto';
import { MovementType } from './enums/movement-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('💰 Ventas Mostrador')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('counter-sales')
export class CounterSalesController {
  constructor(private readonly counterSalesService: CounterSalesService) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar movimiento de inventario (venta, pérdida o uso interno)',
    description: `
Registra salidas de inventario que NO son órdenes de trabajo.

**Tipos de movimiento:**
- **VENTA:** Cliente compra producto sin servicio de instalación. Requiere: comprador, precio_venta por item.
- **PERDIDA:** Producto dañado, vencido o robado. Solo registra el costo perdido (NO suma a caja).
- **USO_INTERNO:** Consumo del taller (ej: aceite para herramientas).

**Lógica automática:**
- Descuenta stock del inventario para todos los tipos
- Calcula total_venta (para VENTA) o costo_perdida (para PERDIDA)
- Solo las VENTAS suman al reporte de caja diaria
    `,
  })
  @ApiBody({ type: CreateCounterSaleDto })
  @ApiResponse({
    status: 201,
    description: 'Movimiento de inventario registrado exitosamente',
    schema: {
      example: {
        message: 'Movimiento registrado exitosamente',
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        tipo: 'VENTA',
        total_venta: 56000,
        costo_perdida: 0,
        items_procesados: 2,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Error de validación: stock insuficiente, producto no existe, cantidad inválida o datos faltantes',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Stock insuficiente para Pastilla Freno. Disponible: 1, Solicitado: 2',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuario no tiene permisos para esta operación',
  })
  create(
    @Body() createCounterSaleDto: CreateCounterSaleDto,
    @CurrentUser() user: { userId: string; nombre: string },
  ) {
    return this.counterSalesService.create(createCounterSaleDto, user.nombre);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los movimientos de inventario',
    description:
      'Retorna todos los movimientos registrados (ventas, pérdidas, uso interno). Se puede filtrar por tipo usando el query param "tipo".',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: MovementType,
    description:
      'Filtrar por tipo de movimiento: VENTA, PERDIDA, USO_INTERNO. Si no se especifica, retorna todos.',
    example: 'VENTA',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos de inventario retornada exitosamente',
    schema: {
      type: 'array',
      example: [
        {
          id: 'uuid',
          tipo: 'VENTA',
          total_venta: 56000,
          costo_perdida: 0,
          comprador: 'Juan Pérez',
          comentario: 'Cliente compró sin instalación',
          fecha_creacion: '2026-01-24T10:30:00.000Z',
          items: [],
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido',
  })
  findAll(@Query('tipo') tipo?: MovementType) {
    if (tipo) {
      return this.counterSalesService.findByType(tipo);
    }
    return this.counterSalesService.findAll();
  }
}
