/**
 * SERVICE: CounterSales (Ventas de Mostrador y Movimientos de Inventario)
 *
 * PROPÓSITO:
 * Cerrar el ciclo de inventario manejando salidas de stock que NO son órdenes de trabajo:
 * - VENTA: Cliente compra repuesto sin servicio de instalación
 * - PERDIDA: Producto dañado/roto/vencido
 * - USO_INTERNO: Consumo del taller sin venta
 *
 * LÓGICA:
 * 1. Validar stock disponible
 * 2. Restar stock del producto
 * 3. Registrar movimiento con tipo y monto
 * 4. Si es VENTA, calcular ingreso
 * 5. Si es PERDIDA, registrar costo de pérdida
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCounterSaleDto } from './dto/create-counter-sale.dto';
import { CounterSale } from './entities/counter-sale.entity';
import { CounterSaleDetail } from './entities/counter-sale-detail.entity';
import { Product } from '../products/entities/product.entity';
import { MovementType } from './enums/movement-type.enum';

@Injectable()
export class CounterSalesService {
  constructor(private dataSource: DataSource) {}

  async create(createCounterSaleDto: CreateCounterSaleDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { tipo_movimiento, items, comentario, comprador } =
        createCounterSaleDto;

      // Validaciones de negocio
      if (tipo_movimiento === MovementType.VENTA && !comprador) {
        throw new BadRequestException(
          'Las ventas requieren el nombre del comprador',
        );
      }

      if (items.length === 0) {
        throw new BadRequestException('Debe incluir al menos un producto');
      }

      // Crear cabecera del movimiento
      const counterSale = new CounterSale();
      counterSale.tipo_movimiento = tipo_movimiento;
      counterSale.comentario = comentario!;
      counterSale.comprador = comprador!;
      counterSale.detalles = [];

      let totalVenta = 0;
      let costoPerdida = 0;

      // Procesar cada item
      for (const item of items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { sku: item.sku },
        });

        if (!product) {
          throw new BadRequestException(
            `El producto con SKU ${item.sku} no existe en inventario.`,
          );
        }

        // Validar stock suficiente
        if (product.stock_actual < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock_actual}, Solicitado: ${item.cantidad}`,
          );
        }

        // Validación específica para VENTA
        if (tipo_movimiento === MovementType.VENTA) {
          if (!item.precio_venta || item.precio_venta <= 0) {
            throw new BadRequestException(
              `El producto ${product.nombre} requiere un precio de venta válido`,
            );
          }
        }

        // Descontar stock
        product.stock_actual -= item.cantidad;
        await queryRunner.manager.save(product);

        // Crear detalle del movimiento
        const detail = new CounterSaleDetail();
        detail.cantidad = item.cantidad;
        detail.producto = product;
        detail.costo_producto = product.precio_venta; // Guardamos el costo actual

        // Calcular totales según tipo de movimiento
        if (tipo_movimiento === MovementType.VENTA) {
          detail.precio_venta_unitario = item.precio_venta!;
          detail.total_fila = item.cantidad * item.precio_venta!;
          totalVenta += detail.total_fila;
        } else if (tipo_movimiento === MovementType.PERDIDA) {
          detail.precio_venta_unitario = 0;
          detail.total_fila = 0;
          // Registramos el costo de lo que se perdió
          costoPerdida += item.cantidad * product.precio_venta;
        } else {
          // USO_INTERNO
          detail.precio_venta_unitario = 0;
          detail.total_fila = 0;
        }

        detail.counterSale = counterSale;
        counterSale.detalles.push(detail);
      }

      counterSale.total_venta = totalVenta;
      counterSale.costo_perdida = costoPerdida;

      // Guardar todo
      await queryRunner.manager.save(counterSale);
      for (const det of counterSale.detalles) {
        await queryRunner.manager.save(CounterSaleDetail, det);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Movimiento registrado exitosamente',
        id: counterSale.id,
        tipo: tipo_movimiento,
        total_venta: totalVenta,
        costo_perdida: costoPerdida,
        items_procesados: items.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.dataSource.manager.find(CounterSale, {
      relations: ['detalles', 'detalles.producto'],
      order: { fecha: 'DESC' },
    });
  }

  async findByType(tipo: MovementType) {
    return await this.dataSource.manager.find(CounterSale, {
      where: { tipo_movimiento: tipo },
      relations: ['detalles', 'detalles.producto'],
      order: { fecha: 'DESC' },
    });
  }
}
