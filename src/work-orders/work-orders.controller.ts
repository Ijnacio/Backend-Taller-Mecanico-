import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  /**
   * GET /work-orders/services-catalog
   * 
   * Retorna el catálogo oficial de servicios disponibles en el taller.
   * El Frontend usa este endpoint para poblar los checkboxes/selectores
   * del formulario de órdenes de trabajo.
   * 
   * Ejemplo de respuesta:
   * [
   *   "Cambio Pastillas",
   *   "Cambio Balatas",
   *   "Rectificado",
   *   ...
   * ]
   */
  @Get('services-catalog')
  getServicesCatalog() {
    return this.workOrdersService.getServicesList();
  }

  @Post()
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Get()
  findAll() {
    return this.workOrdersService.findAll();
  }
}
