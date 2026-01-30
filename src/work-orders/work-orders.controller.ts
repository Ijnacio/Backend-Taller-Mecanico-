import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('📋 Órdenes de Trabajo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) { }

  @Get('services-catalog')
  @ApiOperation({
    summary: 'Obtener catálogo de servicios disponibles',
    description:
      'Retorna la lista completa de servicios que se pueden seleccionar en el formulario de órdenes. Útil para poblar selectores y checkboxes en el frontend.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de servicios disponibles retornada exitosamente',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: [
        'Cambio Pastillas',
        'Cambio Discos',
        'Rectificado',
        'Cambio Líquido Frenos',
        'Revisión Sistema Completo',
        'Cambio Zapatas Traseras',
        'Purga Sistema Frenos',
        'Revisión ABS',
        'Otros',
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido',
  })
  getServicesCatalog() {
    return this.workOrdersService.getServicesList();
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva orden de trabajo',
    description: `
Crea una nueva orden de trabajo con cliente, vehículo y servicios realizados.

**Lógica automática:**
- Si el cliente (RUT) ya existe, se reutiliza y actualiza sus datos
- Si el vehículo (patente) ya existe, se reutiliza y actualiza kilometraje
- Si un item tiene product_sku, descuenta stock automáticamente del inventario
- Calcula total_cobrado sumando todos los precios de items

**Validaciones:**
- numero_orden_papel debe ser único (no repetir números de talón)
- Si usa producto, valida que exista y tenga stock suficiente
- Los precios no pueden ser negativos
    `,
  })
  @ApiBody({ type: CreateWorkOrderDto })
  @ApiResponse({
    status: 201,
    description:
      'Orden de trabajo creada exitosamente con descuento de stock aplicado',
    schema: {
      example: {
        message: 'Orden de trabajo creada exitosamente',
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        numero_orden_papel: 1547,
        total_cobrado: 125000,
        cliente: 'Juan Pérez',
        vehiculo: 'ABCD12',
        items_procesados: 3,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Error de validación: stock insuficiente, producto no existe, número de orden duplicado o datos inválidos',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Stock insuficiente para Disco Ventilado. Disponible: 2, Solicitado: 5',
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
    @Body() createWorkOrderDto: CreateWorkOrderDto,
    @CurrentUser() user: { userId: string; nombre: string },
  ) {
    return this.workOrdersService.create(createWorkOrderDto, user.nombre);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas las órdenes de trabajo',
    description:
      'Retorna todas las órdenes de trabajo con información del cliente, vehículo y detalles de servicios. Las órdenes se ordenan por fecha de creación descendente (más recientes primero).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes de trabajo retornada exitosamente',
    schema: {
      type: 'array',
      example: [
        {
          id: 'uuid',
          numero_orden_papel: 1547,
          total_cobrado: 125000,
          realizado_por: 'Carlos González',
          fecha_creacion: '2026-01-24T10:30:00.000Z',
          cliente: { nombre: 'Juan Pérez', rut: '12345678-9' },
          vehiculo: { patente: 'ABCD12', marca: 'Toyota' },
          items: [],
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido',
  })
  findAll() {
    return this.workOrdersService.findAll();
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una orden de trabajo',
    description: 'Permite actualizar campos de la cabecera como el número de orden papel, o quien realizó/revisó el trabajo.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  @ApiBody({ type: UpdateWorkOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Orden actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada',
  })
  update(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }
}
