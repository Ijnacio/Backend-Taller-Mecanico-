import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard) // Todos los reportes requieren autenticación
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/low-stock
   * Retorna productos con stock bajo (stock_actual <= stock_minimo)
   * Uso: Alertas para recompra
   */
  @Get('low-stock')
  getLowStock() {
    return this.reportsService.getLowStock();
  }

  /**
   * GET /reports/daily-cash
   * GET /reports/daily-cash?fecha=2026-01-22
   * Retorna resumen de caja del día
   * Incluye: WorkOrders + CounterSales (VENTA)
   */
  @Get('daily-cash')
  getDailyCash(@Query('fecha') fecha?: string) {
    return this.reportsService.getDailyCash(fecha);
  }

  /**
   * GET /reports/search?q=texto
   * Buscador global: Clientes, Vehículos, Órdenes
   * Uso: Acceso rápido al historial del cliente
   */
  @Get('search')
  globalSearch(@Query('q') query: string) {
    return this.reportsService.globalSearch(query);
  }
}
