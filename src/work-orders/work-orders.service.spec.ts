/**
 * UNIT TESTS: WorkOrdersService
 * 
 * Pruebas unitarias con mocks de TypeORM.
 * Valida lógica de negocio sin tocar base de datos real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrdersService } from './work-orders.service';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let mockDataSource: Partial<DataSource>;
  let mockQueryRunner: Partial<QueryRunner>;
  let mockManager: any;

  // ========================================
  // SETUP: Mocks de TypeORM
  // ========================================
  beforeEach(async () => {
    // Mock del manager para operaciones de DB
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    // Mock del QueryRunner para transacciones
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };

    // Mock del DataSource
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      manager: mockManager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
  });

  // ========================================
  // TEST 1: Cálculo de Totales
  // ========================================
  describe('create() - Cálculo de Totales', () => {
    it('debe calcular correctamente el total sumando todos los items', async () => {
      // Arrange: Orden con 2 items de $10.000 cada uno
      const dto: CreateWorkOrderDto = {
        numero_orden_papel: 1001,
        realizado_por: 'Carlos Mecánico',
        revisado_por: 'Pedro Supervisor',
        cliente: {
          nombre: 'Juan Pérez',
          rut: '12.345.678-9',
          email: 'juan@test.com',
          telefono: '+56912345678',
        },
        vehiculo: {
          patente: 'ABCD12',
          marca: 'Toyota',
          modelo: 'Yaris',
          kilometraje: 50000,
        },
        items: [
          {
            servicio_nombre: 'Cambio Pastillas',
            descripcion: 'Pastillas delanteras',
            precio: 10000,
          },
          {
            servicio_nombre: 'Revisión ABS',
            descripcion: 'Diagnóstico sistema ABS',
            precio: 10000,
          },
        ],
      };

      // Mock: Cliente y vehículo no existen (se crean nuevos)
      mockManager.findOne.mockResolvedValue(null);
      mockManager.save.mockImplementation((entity: any) => {
        entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result.total).toBe(20000);
      expect(result.message).toBe('Orden creada exitosamente');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('debe calcular total con múltiples items de diferentes precios', async () => {
      const dto: CreateWorkOrderDto = {
        numero_orden_papel: 1002,
        realizado_por: 'Carlos',
        cliente: {
          nombre: 'María López',
          rut: '11.222.333-4',
        },
        vehiculo: {
          patente: 'WXYZ99',
          marca: 'Honda',
          modelo: 'Civic',
        },
        items: [
          { servicio_nombre: 'Cambio Discos', descripcion: '', precio: 45000 },
          { servicio_nombre: 'Cambio Pastillas', descripcion: '', precio: 25000 },
          { servicio_nombre: 'Alineación', descripcion: '', precio: 15000 },
        ],
      };

      mockManager.findOne.mockResolvedValue(null);
      mockManager.save.mockImplementation((entity: any) => {
        entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      const result = await service.create(dto);

      expect(result.total).toBe(85000); // 45000 + 25000 + 15000
    });
  });

  // ========================================
  // TEST 2: Validación de Stock
  // ========================================
  describe('create() - Validación de Stock', () => {
    it('debe lanzar BadRequestException si el stock es insuficiente', async () => {
      // Arrange: Producto con stock 5, pedimos 6
      const dto: CreateWorkOrderDto = {
        numero_orden_papel: 2001,
        realizado_por: 'Carlos',
        cliente: {
          nombre: 'Test Cliente',
          rut: '11.111.111-1',
        },
        vehiculo: {
          patente: 'TEST01',
          marca: 'Test',
          modelo: 'Model',
        },
        items: [
          {
            servicio_nombre: 'Cambio Pastillas',
            descripcion: 'Test',
            precio: 30000,
            product_sku: 'F-001',
            cantidad_producto: 6, // Pedimos 6
          },
        ],
      };

      // Mock dinámico que simula las llamadas en orden
      let findOneCallCount = 0;
      mockManager.findOne.mockImplementation(() => {
        findOneCallCount++;
        if (findOneCallCount === 1) return Promise.resolve(null); // Cliente
        if (findOneCallCount === 2) return Promise.resolve(null); // Vehículo
        if (findOneCallCount === 3) return Promise.resolve({      // Producto
          id: 'product-uuid',
          sku: 'F-001',
          nombre: 'Pastilla Delantera',
          stock_actual: 5, // Solo hay 5
          precio_venta: 25000,
        });
        return Promise.resolve(null);
      });

      mockManager.save.mockImplementation((entity: any) => {
        entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe descontar stock correctamente si hay suficiente', async () => {
      const dto: CreateWorkOrderDto = {
        numero_orden_papel: 2002,
        realizado_por: 'Carlos',
        cliente: {
          nombre: 'Test Cliente',
          rut: '22.222.222-2',
        },
        vehiculo: {
          patente: 'TEST02',
          marca: 'Test',
          modelo: 'Model',
        },
        items: [
          {
            servicio_nombre: 'Cambio Pastillas',
            descripcion: 'Test',
            precio: 30000,
            product_sku: 'F-001',
            cantidad_producto: 3, // Pedimos 3
          },
        ],
      };

      const mockProduct = {
        id: 'product-uuid',
        sku: 'F-001',
        nombre: 'Pastilla Delantera',
        stock_actual: 10, // Hay 10
        precio_venta: 25000,
      };

      mockManager.findOne
        .mockResolvedValueOnce(null) // Cliente
        .mockResolvedValueOnce(null) // Vehículo
        .mockResolvedValueOnce(mockProduct); // Producto

      mockManager.save.mockImplementation((entity: any) => {
        if (!entity.id) entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      await service.create(dto);

      // Verificar que se guardó el producto con stock reducido
      expect(mockProduct.stock_actual).toBe(7); // 10 - 3 = 7
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  // ========================================
  // TEST 3: Producto No Existe
  // ========================================
  describe('create() - Manejo de Errores', () => {
    it('debe lanzar BadRequestException si el producto SKU no existe', async () => {
      const dto: CreateWorkOrderDto = {
        numero_orden_papel: 3001,
        realizado_por: 'Carlos',
        cliente: {
          nombre: 'Test Cliente',
          rut: '33.333.333-3',
        },
        vehiculo: {
          patente: 'TEST03',
          marca: 'Test',
          modelo: 'Model',
        },
        items: [
          {
            servicio_nombre: 'Cambio Pastillas',
            descripcion: 'Test',
            precio: 30000,
            product_sku: 'SKU-NO-EXISTE',
            cantidad_producto: 1,
          },
        ],
      };

      mockManager.findOne
        .mockResolvedValueOnce(null) // Cliente
        .mockResolvedValueOnce(null) // Vehículo
        .mockResolvedValueOnce(null); // Producto NO EXISTE

      mockManager.save.mockImplementation((entity: any) => {
        entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/no existe en inventario/);
    });
  });

  // ========================================
  // TEST 4: Catálogo de Servicios
  // ========================================
  describe('getServicesList()', () => {
    it('debe retornar un array de servicios', () => {
      const services = service.getServicesList();

      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBeGreaterThan(0);
      expect(services).toContain('Cambio Pastillas');
    });

    it('debe retornar una copia del array (inmutabilidad)', () => {
      const services1 = service.getServicesList();
      const services2 = service.getServicesList();

      expect(services1).not.toBe(services2); // Diferentes referencias
      expect(services1).toEqual(services2);  // Mismo contenido
    });
  });

  // ========================================
  // TEST 5: Transacciones
  // ========================================
  describe('Transacciones', () => {
    it('debe hacer rollback si algo falla', async () => {
      const dto: CreateWorkOrderDto = {
        numero_orden_papel: 4001,
        realizado_por: 'Carlos',
        cliente: { nombre: 'Test', rut: '44.444.444-4' },
        vehiculo: { patente: 'TEST04', marca: 'Test', modelo: 'Model' },
        items: [
          {
            servicio_nombre: 'Test',
            descripcion: 'Test',
            precio: 10000,
            product_sku: 'SKU-ERROR',
          },
        ],
      };

      mockManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // Producto no existe

      mockManager.save.mockImplementation((entity: any) => {
        entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      await expect(service.create(dto)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
