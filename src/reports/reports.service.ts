import { Injectable } from '@nestjs/common';
import { DataSource, LessThanOrEqual, Like, Between } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { CounterSale } from '../counter-sales/entities/counter-sale.entity';
import { Client } from '../clients/entities/client.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { MovementType } from '../counter-sales/enums/movement-type.enum';

@Injectable()
export class ReportsService {
  constructor(private dataSource: DataSource) {}

  /**
   * ALERTA DE STOCK BAJO
   * Retorna productos donde stock_actual <= stock_minimo
   * Incluye categoría para facilitar recompra
   */
  async getLowStock() {
    const products = await this.dataSource.manager
      .createQueryBuilder(Product, 'product')
      .leftJoinAndSelect('product.categoria', 'categoria')
      .where('product.stock_actual <= product.stock_minimo')
      .orderBy('product.stock_actual', 'ASC')
      .getMany();

    return {
      total_alertas: products.length,
      fecha_consulta: new Date().toISOString(),
      productos: products.map(p => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        marca: p.marca,
        stock_actual: p.stock_actual,
        stock_minimo: p.stock_minimo,
        diferencia: p.stock_minimo - p.stock_actual,
        categoria: p.categoria?.nombre || 'Sin categoría',
        precio_venta: p.precio_venta
      }))
    };
  }

  /**
   * CAJA DIARIA SIMPLIFICADA
   * Suma ingresos de HOY de WorkOrders y CounterSales (VENTA)
   */
  async getDailyCash(fecha?: string) {
    // Usar fecha proporcionada o fecha actual
    const targetDate = fecha ? new Date(fecha) : new Date();
    
    // Inicio y fin del día
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Sumar total de WorkOrders del día
    const workOrdersResult = await this.dataSource.manager
      .createQueryBuilder(WorkOrder, 'wo')
      .select('COALESCE(SUM(wo.total_cobrado), 0)', 'total')
      .where('wo.fecha_ingreso BETWEEN :start AND :end', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      })
      .getRawOne();

    // Sumar total de CounterSales (solo VENTA) del día
    const counterSalesResult = await this.dataSource.manager
      .createQueryBuilder(CounterSale, 'cs')
      .select('COALESCE(SUM(cs.total_venta), 0)', 'total')
      .where('cs.fecha BETWEEN :start AND :end', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      })
      .andWhere('cs.tipo_movimiento = :tipo', { tipo: MovementType.VENTA })
      .getRawOne();

    // Contar cantidad de transacciones
    const countWorkOrders = await this.dataSource.manager
      .createQueryBuilder(WorkOrder, 'wo')
      .where('wo.fecha_ingreso BETWEEN :start AND :end', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      })
      .getCount();

    const countCounterSales = await this.dataSource.manager
      .createQueryBuilder(CounterSale, 'cs')
      .where('cs.fecha BETWEEN :start AND :end', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      })
      .andWhere('cs.tipo_movimiento = :tipo', { tipo: MovementType.VENTA })
      .getCount();

    const totalTaller = parseInt(workOrdersResult?.total) || 0;
    const totalMeson = parseInt(counterSalesResult?.total) || 0;

    return {
      fecha: targetDate.toISOString().split('T')[0],
      total_taller: totalTaller,
      cantidad_ordenes: countWorkOrders,
      total_meson: totalMeson,
      cantidad_ventas_meson: countCounterSales,
      total_final: totalTaller + totalMeson
    };
  }

  /**
   * BUSCADOR GLOBAL
   * Busca en Clientes (nombre, rut) y Vehículos (patente)
   */
  async globalSearch(query: string) {
    if (!query || query.trim().length < 2) {
      return {
        mensaje: 'Ingresa al menos 2 caracteres para buscar',
        clientes: [],
        vehiculos: []
      };
    }

    const searchTerm = `%${query.trim()}%`;
    const normalizedSearch = query.replace(/\./g, '').replace(/-/g, '').toUpperCase();

    // Buscar clientes por nombre o RUT
    const clientes = await this.dataSource.manager
      .createQueryBuilder(Client, 'client')
      .leftJoinAndSelect('client.ordenes', 'ordenes')
      .where('client.nombre LIKE :term', { term: searchTerm })
      .orWhere('client.rut LIKE :rut', { rut: `%${normalizedSearch}%` })
      .orderBy('client.nombre', 'ASC')
      .take(20)
      .getMany();

    // Buscar vehículos por patente
    const vehiculos = await this.dataSource.manager
      .createQueryBuilder(Vehicle, 'vehicle')
      .where('UPPER(vehicle.patente) LIKE :patente', { 
        patente: `%${query.toUpperCase().replace(/\s/g, '')}%` 
      })
      .orderBy('vehicle.patente', 'ASC')
      .take(20)
      .getMany();

    // Buscar órdenes de trabajo por patente del vehículo
    const ordenesPorPatente = await this.dataSource.manager
      .createQueryBuilder(WorkOrder, 'wo')
      .leftJoinAndSelect('wo.cliente', 'cliente')
      .where('UPPER(wo.patente_vehiculo) LIKE :patente', {
        patente: `%${query.toUpperCase().replace(/\s/g, '')}%`
      })
      .orderBy('wo.fecha_ingreso', 'DESC')
      .take(10)
      .getMany();

    return {
      busqueda: query,
      total_resultados: clientes.length + vehiculos.length + ordenesPorPatente.length,
      clientes: clientes.map(c => ({
        id: c.id,
        nombre: c.nombre,
        rut: c.rut,
        telefono: c.telefono,
        email: c.email,
        cantidad_ordenes: c.ordenes?.length || 0
      })),
      vehiculos: vehiculos.map(v => ({
        id: v.id,
        patente: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio
      })),
      ordenes_recientes: ordenesPorPatente.map(o => ({
        id: o.id,
        numero_orden: o.numero_orden_papel,
        patente: o.patente_vehiculo,
        cliente_nombre: o.cliente?.nombre,
        fecha: o.fecha_ingreso,
        total: o.total_cobrado,
        estado: o.estado
      }))
    };
  }
}
