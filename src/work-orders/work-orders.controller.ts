import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('📋 Órdenes de Trabajo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get('services-catalog')
  @ApiOperation({ 
    summary: 'Catálogo de servicios disponibles',
    description: 'Retorna la lista de servicios que se pueden seleccionar en el formulario. Usar para poblar selectores/checkboxes.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de servicios disponibles',
    schema: {
      example: [
        'Cambio Pastillas',
        'Cambio Discos',
        'Rectificado',
        'Cambio Líquido Frenos',
        'Revisión Sistema Completo',
        'Cambio Zapatas Traseras',
        'Purga Sistema Frenos',
        'Revisión ABS',
        'Otros'
      ]
    }
  })
  getServicesCatalog() {
    return this.workOrdersService.getServicesList();
  }

  @Post()
  @ApiOperation({ 
    summary: 'Crear orden de trabajo',
    description: `
Crea una nueva orden de trabajo con cliente, vehículo y servicios.

**Lógica automática:**
- Si el cliente (RUT) ya existe, se reutiliza y actualiza sus datos
- Si el vehículo (patente) ya existe, se reutiliza y actualiza kilometraje
- Si un item tiene product_sku, descuenta stock automáticamente
- Calcula total_cobrado sumando todos los precios

**Validaciones:**
- numero_orden_papel debe ser único
- Si usa producto, valida stock suficiente
    ` 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Orden creada exitosamente',
    schema: {
      example: {
        message: 'Orden de trabajo creada exitosamente',
        id: 'uuid-orden',
        numero_orden_papel: 1547,
        total_cobrado: 125000,
        cliente: 'Juan Pérez',
        vehiculo: 'ABCD12',
        items_procesados: 3
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o producto no existe' })
  @ApiResponse({ status: 401, description: 'Token JWT requerido' })
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todas las órdenes',
    description: 'Retorna todas las órdenes de trabajo con cliente y detalles. Ordenadas por fecha descendente.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de órdenes de trabajo' 
  })
  findAll() {
    return this.workOrdersService.findAll();
  }
}
