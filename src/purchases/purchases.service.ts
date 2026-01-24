import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Purchase } from './entities/purchase.entity';
import { PurchaseDetail } from './entities/purchase-detail.entity';
import { Provider } from '../providers/entities/provider.entity';
import { Product } from '../products/entities/product.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

@Injectable()
export class PurchasesService {
  constructor(private dataSource: DataSource) {}

  async create(createPurchaseDto: CreatePurchaseDto, createdByName?: string) {
    // FIX AUDITORIA 2: Validar proveedor
    if (
      !createPurchaseDto.proveedor_nombre ||
      createPurchaseDto.proveedor_nombre.trim() === ''
    ) {
      throw new BadRequestException('El nombre del proveedor es obligatorio');
    }

    if (!createPurchaseDto.items || createPurchaseDto.items.length === 0) {
      throw new BadRequestException(
        'La compra debe tener al menos un producto',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. GESTIÓN PROVEEDOR
      let provider = await queryRunner.manager.findOne(Provider, {
        where: { nombre: createPurchaseDto.proveedor_nombre },
      });
      if (!provider) {
        provider = queryRunner.manager.create(Provider, {
          nombre: createPurchaseDto.proveedor_nombre,
        });
        await queryRunner.manager.save(provider);
      }

      // 2. PREPARAR CABECERA
      const purchase = new Purchase();
      purchase.numero_factura = createPurchaseDto.numero_documento || 'S/N';
      purchase.proveedor = provider;
      purchase.detalles = [];

      let sumaTotalGasto = 0;

      // 3. PROCESAR ITEMS
      for (const item of createPurchaseDto.items) {
        // FIX AUDITORIA FINAL: Validaciones Críticas
        if (!item.sku || item.sku.trim() === '')
          throw new BadRequestException(
            'El SKU es obligatorio en todos los items',
          );
        if (item.cantidad <= 0)
          throw new BadRequestException(
            `La cantidad del SKU ${item.sku} debe ser positiva`,
          );
        if (item.precio_costo < 0)
          throw new BadRequestException(
            `El costo del SKU ${item.sku} no puede ser negativo`,
          );
        if (item.precio_venta_sugerido < 0)
          throw new BadRequestException(
            `El precio sugerido del SKU ${item.sku} no puede ser negativo`,
          );

        // FIX AUDITORIA FINAL: Redondeo preventivo (Integers)
        const costoUnitario = Math.round(item.precio_costo);
        const precioVenta = Math.round(item.precio_venta_sugerido);
        const totalFila = Math.round(item.cantidad * costoUnitario);

        let product = await queryRunner.manager.findOne(Product, {
          where: { sku: item.sku },
          relations: ['vehiculosCompatibles'],
        });

        if (!product) {
          // --- PRODUCTO NUEVO ---
          product = new Product();
          product.sku = item.sku;
          product.nombre = item.nombre;
          product.marca = item.marca;
          product.calidad = item.calidad;
          product.precio_venta = precioVenta; // Usamos el redondeado
          product.stock_actual = 0;
          product.vehiculosCompatibles = [];
        } else {
          // --- PRODUCTO EXISTENTE ---
          product.precio_venta = precioVenta;
          if (!product.marca && item.marca) product.marca = item.marca;
          if (!product.calidad && item.calidad) product.calidad = item.calidad;
        }

        // Merge de Vehículos
        if (item.vehiculos_ids && item.vehiculos_ids.length > 0) {
          const nuevosVehiculos = await queryRunner.manager.find(Vehicle, {
            where: { id: In(item.vehiculos_ids) },
          });
          const vehiculosActuales = product.vehiculosCompatibles || [];
          const vehiculosA_Agregar = nuevosVehiculos.filter(
            (nv) => !vehiculosActuales.some((va) => va.id === nv.id),
          );
          product.vehiculosCompatibles = [
            ...vehiculosActuales,
            ...vehiculosA_Agregar,
          ];
        }

        // Actualizar Stock
        product.stock_actual += item.cantidad;
        await queryRunner.manager.save(product);

        // Crear Detalle Historial
        const detail = new PurchaseDetail();
        detail.producto = product;
        detail.cantidad = item.cantidad;
        detail.precio_costo_unitario = costoUnitario; // Guardamos Integer
        detail.total_fila = totalFila; // Guardamos Integer
        detail.compra = purchase;

        purchase.detalles.push(detail);
        sumaTotalGasto += totalFila;
      }

      // 4. CÁLCULOS FINALES
      if (createPurchaseDto.tipo_documento === 'FACTURA') {
        purchase.monto_neto = sumaTotalGasto;
        purchase.monto_iva = Math.round(sumaTotalGasto * 0.19);
        purchase.monto_total = purchase.monto_neto + purchase.monto_iva;
      } else {
        purchase.monto_neto = sumaTotalGasto;
        purchase.monto_iva = 0;
        purchase.monto_total = sumaTotalGasto;
      }

      // AUDITORÍA: Guardar quién registró la compra
      purchase.createdByName = createdByName || 'ADMIN';

      await queryRunner.manager.save(purchase);

      for (const det of purchase.detalles) {
        await queryRunner.manager.save(PurchaseDetail, det);
      }

      await queryRunner.commitTransaction();

      // Eliminar referencias circulares para serialización JSON
      const result = {
        id: purchase.id,
        numero_factura: purchase.numero_factura,
        fecha: purchase.fecha,
        monto_neto: purchase.monto_neto,
        monto_iva: purchase.monto_iva,
        monto_total: purchase.monto_total,
        proveedor: purchase.proveedor,
        detalles: purchase.detalles.map((det) => ({
          id: det.id,
          cantidad: det.cantidad,
          precio_costo_unitario: det.precio_costo_unitario,
          total_fila: det.total_fila,
          producto: det.producto
            ? {
                id: det.producto.id,
                sku: det.producto.sku,
                nombre: det.producto.nombre,
                stock_actual: det.producto.stock_actual,
              }
            : null,
        })),
      };

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchase = await queryRunner.manager.findOne(Purchase, {
        where: { id },
        relations: ['detalles', 'detalles.producto'],
      });

      if (!purchase) {
        throw new BadRequestException('Compra no encontrada');
      }

      // Revertir stock de todos los productos
      for (const det of purchase.detalles) {
        if (det.producto) {
          det.producto.stock_actual -= det.cantidad;
          if (det.producto.stock_actual < 0) det.producto.stock_actual = 0;
          await queryRunner.manager.save(det.producto);
        }
      }

      await queryRunner.manager.remove(purchase);
      await queryRunner.commitTransaction();
      return { message: 'Compra eliminada y stock revertido', id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    const purchases = await this.dataSource.manager.find(Purchase, {
      relations: ['proveedor', 'detalles', 'detalles.producto'],
      order: { fecha: 'DESC' },
    });

    // Eliminar referencias circulares
    return purchases.map((purchase) => ({
      id: purchase.id,
      numero_factura: purchase.numero_factura,
      fecha: purchase.fecha,
      monto_neto: purchase.monto_neto,
      monto_iva: purchase.monto_iva,
      monto_total: purchase.monto_total,
      proveedor: purchase.proveedor,
      detalles:
        purchase.detalles?.map((det) => ({
          id: det.id,
          cantidad: det.cantidad,
          precio_costo_unitario: det.precio_costo_unitario,
          total_fila: det.total_fila,
          producto: det.producto
            ? {
                id: det.producto.id,
                sku: det.producto.sku,
                nombre: det.producto.nombre,
                stock_actual: det.producto.stock_actual,
              }
            : null,
        })) || [],
    }));
  }
}
