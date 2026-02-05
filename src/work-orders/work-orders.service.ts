/**
 * CONTEXTO: Sistema de Taller Mecánico "Frenos Aguilera".
 * OBJETIVO: Crear una Orden de Trabajo (WorkOrder) que replique un formulario de papel físico.
 *
 * REGLAS DE NEGOCIO:
 * 1. Cliente: Se debe buscar por RUT o Email. Si no existe, se crea.
 * 2. Vehículo: Se busca por Patente. Si no existe, se crea/actualiza.
 * 3. Items de la Orden:
 *    - Recibe un array de servicios (ej: "Cambio Pastillas", "Rectificado").
 *    - Cada item tiene: nombre, descripción (lo que se escribió en el papel), precio cobrado.
 *    - OPCIONAL: Puede traer un SKU de producto asociado.
 *    - SI TRAE SKU: Se debe buscar el producto, validar stock, RESTAR stock y guardar.
 * 4. Totales: Se debe sumar el total de la orden automáticamente.
 * 5. Transacción: Todo debe ser atómico. Si falla algo (ej: falta stock), falla toda la orden.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderDetail } from './entities/work-order-detail.entity';
import { Client } from '../clients/entities/client.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Product } from '../products/entities/product.entity';
import { WORK_ORDER_SERVICES } from './constants/services.constant';

@Injectable()
export class WorkOrdersService {
  constructor(private dataSource: DataSource) { }

  async create(createWorkOrderDto: CreateWorkOrderDto, createdByName?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        cliente: clienteDto,
        vehiculo: vehiculoDto,
        items,
        numero_orden_papel,
        realizado_por,
        revisado_por,
      } = createWorkOrderDto;

      // ---------------------------------------------------------
      // 1. GESTIÓN DEL CLIENTE (Find or Create) - CON NORMALIZACIÓN
      // ---------------------------------------------------------
      let client: Client | null = null;

      // Normalizar inputs para evitar duplicados
      const rutNormalizado = clienteDto.rut
        ? clienteDto.rut.replace(/\./g, '').replace(/-/g, '').toUpperCase()
        : null;
      const emailNormalizado = clienteDto.email
        ? clienteDto.email.toLowerCase().trim()
        : null;

      // Intentamos buscar por RUT primero (es lo más seguro)
      if (rutNormalizado) {
        client = await queryRunner.manager.findOne(Client, {
          where: { rut: rutNormalizado },
        });
      }

      // Si no hay RUT o no se encontró, intentamos por Email
      if (!client && emailNormalizado) {
        client = await queryRunner.manager.findOne(Client, {
          where: { email: emailNormalizado },
        });
      }

      // Si no existe, lo creamos
      if (!client) {
        client = new Client();
        client.nombre = clienteDto.nombre;
        client.rut = rutNormalizado!;
        client.email = emailNormalizado!;
        client.telefono = clienteDto.telefono;
        await queryRunner.manager.save(client);
      } else {
        // Actualizar datos si cambiaron (ej: nuevo teléfono)
        if (clienteDto.telefono) client.telefono = clienteDto.telefono;
        await queryRunner.manager.save(client);
      }

      // ---------------------------------------------------------
      // 2. GESTIÓN DEL VEHÍCULO - CON NORMALIZACIÓN
      // ---------------------------------------------------------
      const patenteNormalizada = vehiculoDto.patente.toUpperCase().trim();
      let vehicle = await queryRunner.manager.findOne(Vehicle, {
        where: { patente: patenteNormalizada },
        relations: ['cliente'],
      });

      if (!vehicle) {
        vehicle = new Vehicle();
        vehicle.patente = patenteNormalizada;
        vehicle.marca = vehiculoDto.marca;
        vehicle.modelo = vehiculoDto.modelo;
      }

      // SIEMPRE actualizar kilometraje al valor nuevo
      if (vehiculoDto.kilometraje) {
        vehicle.kilometraje = vehiculoDto.kilometraje;
      }

      // VALIDAR QUE EL VEHÍCULO PERTENEZCA AL CLIENTE CORRECTO
      if (vehicle.cliente && vehicle.cliente.id !== client.id) {
        throw new BadRequestException(
          `La patente ${patenteNormalizada} ya está registrada para otro cliente (${vehicle.cliente.nombre}). No se puede reasignar.`
        );
      }

      // ASOCIAR VEHÍCULO AL CLIENTE (solo si no tiene dueño)
      if (!vehicle.cliente) {
        vehicle.cliente = client;
      }

      await queryRunner.manager.save(vehicle);

      // ---------------------------------------------------------
      // 3. CABECERA DE LA ORDEN
      // ---------------------------------------------------------
      const order = new WorkOrder();
      order.numero_orden_papel = numero_orden_papel;
      order.cliente = client;
      order.patente_vehiculo = vehicle.patente;
      order.kilometraje = vehiculoDto.kilometraje;
      order.realizado_por = realizado_por;
      order.revisado_por = revisado_por;
      order.estado = 'FINALIZADA';
      order.fecha_ingreso = new Date();
      order.detalles = [];

      let totalOrden = 0;

      // ---------------------------------------------------------
      // 4. PROCESAMIENTO DE ITEMS Y STOCK
      // ---------------------------------------------------------
      for (const item of items) {
        // Soportar tanto cantidad como cantidad_producto
        const cantidadItem = item.cantidad_producto || item.cantidad || 1;

        const detail = new WorkOrderDetail();
        detail.servicio_nombre = item.servicio_nombre;
        detail.descripcion = item.descripcion || '';
        detail.precio = item.precio; // Precio UNITARIO
        detail.cantidad = cantidadItem; // Guardar cantidad

        // LÓGICA DE INVENTARIO
        if (item.product_sku) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { sku: item.product_sku },
          });

          if (!product) {
            throw new BadRequestException(
              `El producto con SKU ${item.product_sku} no existe en inventario.`,
            );
          }

          if (product.stock_actual < cantidadItem) {
            throw new BadRequestException(
              `Stock insuficiente para el producto "${product.nombre}". Disponible: ${product.stock_actual} unidades.`,
            );
          }

          // Descontar stock
          product.stock_actual -= cantidadItem;
          await queryRunner.manager.save(product);

          // Guardar referencia en el detalle
          detail.producto = product;
        }

        detail.workOrder = order;
        order.detalles.push(detail);
        // Total = precio unitario * cantidad
        totalOrden += item.precio * cantidadItem;
      }

      order.total_cobrado = totalOrden;

      // AUDITORÍA: Guardar quién registró la orden
      order.createdByName = createdByName || 'WORKER';

      // Guardar todo
      await queryRunner.manager.save(order);
      for (const det of order.detalles) {
        await queryRunner.manager.save(WorkOrderDetail, det);
      }

      await queryRunner.commitTransaction();
      return {
        message: 'Orden creada exitosamente',
        orden_id: order.id,
        total: totalOrden,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Manejo de error de duplicidad para numero_orden_papel (Postgres code '23505')
      const dbError = error as { code?: string; detail?: string };
      if (
        dbError.code === '23505' &&
        dbError.detail?.includes('numero_orden_papel')
      ) {
        throw new BadRequestException(
          `El número de orden ${createWorkOrderDto.numero_orden_papel} ya existe en el sistema.`,
        );
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.dataSource.manager.find(WorkOrder, {
      relations: ['cliente', 'detalles', 'detalles.producto'],
      order: { fecha_ingreso: 'DESC' },
    });
  }

  /**
   * Retorna el catálogo oficial de servicios del taller.
   * Este método es consumido por el Frontend para mostrar los checkboxes/opciones
   * disponibles en el formulario de órdenes de trabajo.
   *
   * @returns Array de strings con los nombres de servicios oficiales
   */
  getServicesList(): string[] {
    return [...WORK_ORDER_SERVICES]; // Retornamos una copia para evitar mutaciones
  }

  async findOne(id: string) {
    return await this.dataSource.manager.findOne(WorkOrder, {
      where: { id },
      relations: ['cliente', 'detalles', 'detalles.producto'],
    });
  }

  async update(id: string, updateWorkOrderDto: UpdateWorkOrderDto) {
    const order = await this.findOne(id);
    if (!order) {
      throw new BadRequestException(`Orden de trabajo con ID ${id} no encontrada`);
    }

    // Actualizar campos simples si vienen
    if (updateWorkOrderDto.numero_orden_papel) order.numero_orden_papel = updateWorkOrderDto.numero_orden_papel;
    if (updateWorkOrderDto.realizado_por) order.realizado_por = updateWorkOrderDto.realizado_por;
    if (updateWorkOrderDto.revisado_por) order.revisado_por = updateWorkOrderDto.revisado_por;

    // NOTA: No implementamos la actualización compleja de items/stock aquí para mantenerlo simple por ahora
    // Si se requiere editar items, se debería hacer un mecanismo de anulación/re-creación o lógica compleja de inventario.

    return await this.dataSource.manager.save(order);
  }
}