import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CounterSalesService } from './counter-sales.service';
import { CreateCounterSaleDto } from './dto/create-counter-sale.dto';
import { MovementType } from './enums/movement-type.enum';

@Controller('counter-sales')
export class CounterSalesController {
  constructor(private readonly counterSalesService: CounterSalesService) {}

  /**
   * POST /counter-sales
   * 
   * Registra movimientos de inventario:
   * - VENTA: Venta de mostrador sin servicio
   * - PERDIDA: Producto dañado/roto
   * - USO_INTERNO: Consumo del taller
   * 
   * Descuenta automáticamente el stock.
   */
  @Post()
  create(@Body() createCounterSaleDto: CreateCounterSaleDto) {
    return this.counterSalesService.create(createCounterSaleDto);
  }

  /**
   * GET /counter-sales
   * 
   * Lista todos los movimientos de inventario.
   * Puede filtrar por tipo usando ?tipo=VENTA
   */
  @Get()
  findAll(@Query('tipo') tipo?: MovementType) {
    if (tipo) {
      return this.counterSalesService.findByType(tipo);
    }
    return this.counterSalesService.findAll();
  }
}
