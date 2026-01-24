/**
 * UNIT TESTS: CounterSalesService
 * 
 * Pruebas unitarias con mocks de TypeORM.
 * Valida lógica de ventas de mostrador, pérdidas y uso interno.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CounterSalesService } from './counter-sales.service';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreateCounterSaleDto } from './dto/create-counter-sale.dto';
import { MovementType } from './enums/movement-type.enum';

describe('CounterSalesService', () => {
  let service: CounterSalesService;
  let mockDataSource: Partial<DataSource>;
  let mockQueryRunner: Partial<QueryRunner>;
  let mockManager: any;

  // ========================================
  // SETUP: Mocks de TypeORM
  // ========================================
  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      manager: mockManager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounterSalesService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CounterSalesService>(CounterSalesService);
  });

  // ========================================
  // TEST 1: Cálculo de Totales (VENTA)
  // ========================================
  describe('create() - Cálculo de Totales VENTA', () => {
    it('debe calcular total_venta correctamente con múltiples items', async () => {
      // Arrange: 2 unidades a $10.000 cada una
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente Test',
        comentario: 'Venta de prueba',
        items: [
          { sku: 'F-001', cantidad: 2, precio_venta: 10000 },
        ],
      };

      const mockProduct = {
        id: 'product-uuid',
        sku: 'F-001',
        nombre: 'Pastilla Test',
        stock_actual: 10,
        precio_venta: 8000, // Costo del producto
      };

      mockManager.findOne.mockResolvedValue(mockProduct);
      mockManager.save.mockImplementation((entity: any) => {
        if (!entity.id) entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result.total_venta).toBe(20000); // 2 x $10.000
      expect(result.tipo).toBe('VENTA');
      expect(result.items_procesados).toBe(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('debe sumar totales de múltiples productos', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente Test',
        items: [
          { sku: 'F-001', cantidad: 2, precio_venta: 10000 }, // $20.000
          { sku: 'F-002', cantidad: 1, precio_venta: 15000 }, // $15.000
        ],
      };

      const mockProduct1 = { id: 'p1', sku: 'F-001', nombre: 'Producto 1', stock_actual: 10, precio_venta: 8000 };
      const mockProduct2 = { id: 'p2', sku: 'F-002', nombre: 'Producto 2', stock_actual: 5, precio_venta: 12000 };

      mockManager.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      mockManager.save.mockImplementation((entity: any) => {
        if (!entity.id) entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      const result = await service.create(dto);

      expect(result.total_venta).toBe(35000); // $20.000 + $15.000
    });
  });

  // ========================================
  // TEST 2: Cálculo de PERDIDA
  // ========================================
  describe('create() - Cálculo de PERDIDA', () => {
    it('debe calcular costo_perdida basado en precio_venta del producto', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.PERDIDA,
        comentario: 'Producto dañado por agua',
        items: [
          { sku: 'F-001', cantidad: 3 }, // Sin precio_venta
        ],
      };

      const mockProduct = {
        id: 'product-uuid',
        sku: 'F-001',
        nombre: 'Disco Ventilado',
        stock_actual: 10,
        precio_venta: 25000, // Costo unitario
      };

      mockManager.findOne.mockResolvedValue(mockProduct);
      mockManager.save.mockImplementation((entity: any) => {
        if (!entity.id) entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      const result = await service.create(dto);

      expect(result.tipo).toBe('PERDIDA');
      expect(result.costo_perdida).toBe(75000); // 3 x $25.000
      expect(result.total_venta).toBe(0);
    });
  });

  // ========================================
  // TEST 3: Validación de Stock
  // ========================================
  describe('create() - Validación de Stock', () => {
    it('debe lanzar BadRequestException si stock es insuficiente', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente Test',
        items: [
          { sku: 'F-001', cantidad: 10, precio_venta: 5000 }, // Pide 10
        ],
      };

      const mockProduct = {
        id: 'product-uuid',
        sku: 'F-001',
        nombre: 'Pastilla Test',
        stock_actual: 5, // Solo hay 5
        precio_venta: 4000,
      };

      mockManager.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/Stock insuficiente/);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe descontar stock correctamente si hay suficiente', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente Test',
        items: [
          { sku: 'F-001', cantidad: 3, precio_venta: 5000 },
        ],
      };

      const mockProduct = {
        id: 'product-uuid',
        sku: 'F-001',
        nombre: 'Pastilla Test',
        stock_actual: 10,
        precio_venta: 4000,
      };

      mockManager.findOne.mockResolvedValue(mockProduct);
      mockManager.save.mockImplementation((entity: any) => {
        if (!entity.id) entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      await service.create(dto);

      expect(mockProduct.stock_actual).toBe(7); // 10 - 3
    });
  });

  // ========================================
  // TEST 4: Validaciones de Negocio
  // ========================================
  describe('create() - Validaciones de Negocio', () => {
    it('debe requerir comprador para VENTA', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        // comprador: FALTA
        items: [
          { sku: 'F-001', cantidad: 1, precio_venta: 5000 },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/requieren el nombre del comprador/);
    });

    it('debe requerir precio_venta para items de VENTA', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente Test',
        items: [
          { sku: 'F-001', cantidad: 1 }, // Sin precio_venta
        ],
      };

      const mockProduct = {
        id: 'product-uuid',
        sku: 'F-001',
        nombre: 'Pastilla Test',
        stock_actual: 10,
        precio_venta: 4000,
      };

      mockManager.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/precio de venta válido/);
    });

    it('debe rechazar lista vacía de items', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente Test',
        items: [], // Vacío
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/al menos un producto/);
    });

    it('debe lanzar error si producto no existe', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente Test',
        items: [
          { sku: 'SKU-NO-EXISTE', cantidad: 1, precio_venta: 5000 },
        ],
      };

      mockManager.findOne.mockResolvedValue(null); // Producto no existe

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(/no existe en inventario/);
    });
  });

  // ========================================
  // TEST 5: USO_INTERNO
  // ========================================
  describe('create() - USO_INTERNO', () => {
    it('debe registrar movimiento sin calcular totales monetarios', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.USO_INTERNO,
        comentario: 'Aceite para herramientas del taller',
        items: [
          { sku: 'L-001', cantidad: 1 },
        ],
      };

      const mockProduct = {
        id: 'product-uuid',
        sku: 'L-001',
        nombre: 'Aceite 10W40',
        stock_actual: 20,
        precio_venta: 35000,
      };

      mockManager.findOne.mockResolvedValue(mockProduct);
      mockManager.save.mockImplementation((entity: any) => {
        if (!entity.id) entity.id = 'mock-uuid';
        return Promise.resolve(entity);
      });

      const result = await service.create(dto);

      expect(result.tipo).toBe('USO_INTERNO');
      expect(result.total_venta).toBe(0);
      expect(result.costo_perdida).toBe(0);
      expect(mockProduct.stock_actual).toBe(19); // Sí descuenta stock
    });
  });

  // ========================================
  // TEST 6: Transacciones
  // ========================================
  describe('Transacciones', () => {
    it('debe hacer commit en operación exitosa', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente OK',
        items: [{ sku: 'F-001', cantidad: 1, precio_venta: 5000 }],
      };

      mockManager.findOne.mockResolvedValue({
        id: 'p1', sku: 'F-001', nombre: 'Test', stock_actual: 10, precio_venta: 4000,
      });
      mockManager.save.mockImplementation((e: any) => {
        if (!e.id) e.id = 'uuid';
        return Promise.resolve(e);
      });

      await service.create(dto);

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('debe hacer rollback en caso de error', async () => {
      const dto: CreateCounterSaleDto = {
        tipo_movimiento: MovementType.VENTA,
        comprador: 'Cliente',
        items: [{ sku: 'NO-EXISTE', cantidad: 1, precio_venta: 5000 }],
      };

      mockManager.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
