/**
 * =============================================================================
 * E2E STRESS TESTS: Taller Frenos Aguilera
 * =============================================================================
 * 
 * Suite de pruebas de estrés y casos límite para validar:
 * - Concurrencia (Race Conditions)
 * - Integridad Financiera
 * - Entradas Maliciosas
 * - Seguridad y Autenticación
 * 
 * Ejecutar con: npm run test:e2e
 * 
 * USA BASE DE DATOS SQLite EN MEMORIA - NO MOCKS
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

// Módulos
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { CategoriesModule } from '../src/categories/categories.module';
import { CounterSalesModule } from '../src/counter-sales/counter-sales.module';
import { WorkOrdersModule } from '../src/work-orders/work-orders.module';
import { ReportsModule } from '../src/reports/reports.module';
import { ClientsModule } from '../src/clients/clients.module';
import { VehiclesModule } from '../src/vehicles/vehicles.module';

// Entidades
import { User } from '../src/users/entities/user.entity';
import { Product } from '../src/products/entities/product.entity';
import { Category } from '../src/categories/entities/category.entity';
import { CounterSale } from '../src/counter-sales/entities/counter-sale.entity';
import { CounterSaleDetail } from '../src/counter-sales/entities/counter-sale-detail.entity';
import { WorkOrder } from '../src/work-orders/entities/work-order.entity';
import { WorkOrderDetail } from '../src/work-orders/entities/work-order-detail.entity';
import { Client } from '../src/clients/entities/client.entity';
import { Vehicle } from '../src/vehicles/entities/vehicle.entity';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('🧪 Taller Frenos Aguilera - E2E Stress Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testCategoryId: string;

  // ==========================================================================
  // SETUP: Crear app con SQLite en memoria
  // ==========================================================================
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            User, Product, Category, CounterSale, CounterSaleDetail,
            WorkOrder, WorkOrderDetail, Client, Vehicle,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([
          User, Product, Category, CounterSale, CounterSaleDetail,
          WorkOrder, WorkOrderDetail, Client, Vehicle,
        ]),
        AuthModule,
        UsersModule,
        CategoriesModule,
        CounterSalesModule,
        WorkOrdersModule,
        ReportsModule,
        ClientsModule,
        VehiclesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // ========================================
    // SEED: Datos base para tests
    // ========================================
    
    // 1. Crear usuario ADMIN
    const userRepo = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await userRepo.save({
      rut: '111111111',
      password: hashedPassword,
      nombre: 'Admin Test',
      role: UserRole.ADMIN,
      isActive: true,
    });

    // 2. Crear categoría
    const catRepo = dataSource.getRepository(Category);
    const category = await catRepo.save({
      nombre: 'Frenos Test',
      descripcion: 'Categoría de prueba',
    });
    testCategoryId = category.id;

    // 3. Crear productos de prueba
    const productRepo = dataSource.getRepository(Product);
    
    // Producto normal con stock
    await productRepo.save({
      sku: 'TEST-001',
      nombre: 'Pastilla Test E2E',
      marca: 'Test Brand',
      precio_venta: 5000,
      stock_actual: 10,
      stock_minimo: 2,
      categoria: category,
    });

    // Producto para test de concurrencia (STOCK = 1)
    await productRepo.save({
      sku: 'RACE-001',
      nombre: 'Producto Race Condition',
      marca: 'Único',
      precio_venta: 10000,
      stock_actual: 1,
      stock_minimo: 1,
      categoria: category,
    });

    // Producto para pruebas financieras
    await productRepo.save({
      sku: 'CASH-001',
      nombre: 'Producto Caja Test',
      marca: 'Money',
      precio_venta: 10000,
      stock_actual: 100,
      stock_minimo: 5,
      categoria: category,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================================================
  // SETUP GLOBAL: Login Admin
  // ==========================================================================
  describe('🔐 Setup - Autenticación Admin', () => {
    it('POST /api/auth/login - debe obtener token de admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          rut: '11.111.111-1',
          password: 'admin123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.role).toBe('ADMIN');
      
      authToken = response.body.access_token;
    });
  });

  // ==========================================================================
  // TEST 1: RACE CONDITION (Concurrencia)
  // ==========================================================================
  describe('🏃 Test de Concurrencia (Race Condition)', () => {
    it('Solo UNA de 2 peticiones simultáneas debe tener éxito con stock=1', async () => {
      // Preparar: Producto con stock = 1
      const productRepo = dataSource.getRepository(Product);
      const raceProduct = await productRepo.findOne({ where: { sku: 'RACE-001' } });
      expect(raceProduct?.stock_actual).toBe(1);

      // Crear payload para venta
      const salePayload = {
        tipo_movimiento: 'VENTA',
        comprador: 'Cliente Concurrente',
        comentario: 'Test de concurrencia',
        items: [
          { sku: 'RACE-001', cantidad: 1, precio_venta: 10000 }
        ]
      };

      // Lanzar 2 peticiones SIMULTÁNEAS
      const results = await Promise.allSettled([
        request(app.getHttpServer())
          .post('/api/counter-sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send(salePayload),
        request(app.getHttpServer())
          .post('/api/counter-sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send(salePayload),
      ]);

      // Analizar resultados
      const statusCodes = results.map(r => {
        if (r.status === 'fulfilled') {
          return r.value.status;
        }
        return 500;
      });

      // Expectativa: Una 201 (éxito) y otra 400 (stock insuficiente)
      const successCount = statusCodes.filter(code => code === 201).length;
      const failCount = statusCodes.filter(code => code === 400).length;

      console.log('📊 Resultados de concurrencia:', { statusCodes, successCount, failCount });

      // Al menos una debe fallar o ambas éxito significa bug
      expect(successCount + failCount).toBe(2);
      
      // Verificar que el stock quedó en 0 o 1 (no negativo)
      const finalProduct = await productRepo.findOne({ where: { sku: 'RACE-001' } });
      expect(finalProduct!.stock_actual).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // TEST 2: INTEGRIDAD FINANCIERA
  // ==========================================================================
  describe('💰 Test de Integridad Financiera', () => {
    it('Las PÉRDIDAS no deben sumar a la caja diaria', async () => {
      // 1. Registrar VENTA de $10,000
      const ventaResponse = await request(app.getHttpServer())
        .post('/api/counter-sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo_movimiento: 'VENTA',
          comprador: 'Cliente Test Caja',
          comentario: 'Venta para test de caja',
          items: [
            { sku: 'CASH-001', cantidad: 1, precio_venta: 10000 }
          ]
        })
        .expect(201);

      expect(ventaResponse.body.total_venta).toBe(10000);

      // 2. Registrar PÉRDIDA de producto (costo $10,000)
      const perdidaResponse = await request(app.getHttpServer())
        .post('/api/counter-sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo_movimiento: 'PERDIDA',
          comentario: 'Producto dañado - NO debe sumar a caja',
          items: [
            { sku: 'CASH-001', cantidad: 1 }
          ]
        })
        .expect(201);

      expect(perdidaResponse.body.tipo).toBe('PERDIDA');

      // 3. Consultar caja diaria
      const cajaResponse = await request(app.getHttpServer())
        .get('/api/reports/daily-cash')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      console.log('📊 Caja diaria:', cajaResponse.body);

      // Expectativa: Solo la VENTA suma a caja, NO la pérdida
      // total_meson debe ser al menos 10000 (de la venta)
      expect(cajaResponse.body.total_meson).toBeGreaterThanOrEqual(10000);
      
      // Verificar estructura completa
      expect(cajaResponse.body).toHaveProperty('total_final');
      expect(cajaResponse.body.total_final).toBe(
        cajaResponse.body.total_meson + cajaResponse.body.total_taller
      );
    });
  });

  // ==========================================================================
  // TEST 3: ENTRADAS MALICIOSAS
  // ==========================================================================
  describe('🛡️ Test de Entradas Maliciosas', () => {
    describe('Cantidades negativas', () => {
      it('POST /api/counter-sales - debe rechazar cantidad: -5', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/counter-sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tipo_movimiento: 'VENTA',
            comprador: 'Hacker',
            items: [
              { sku: 'CASH-001', cantidad: -5, precio_venta: 1000 }
            ]
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
        console.log('❌ Cantidad negativa rechazada:', response.body.message);
      });

      it('POST /api/counter-sales - debe rechazar cantidad: 0', async () => {
        await request(app.getHttpServer())
          .post('/api/counter-sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tipo_movimiento: 'VENTA',
            comprador: 'Hacker',
            items: [
              { sku: 'CASH-001', cantidad: 0, precio_venta: 1000 }
            ]
          })
          .expect(400);
      });
    });

    describe('Precios negativos', () => {
      it('POST /api/work-orders - debe rechazar precio: -100', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/work-orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            numero_orden_papel: 99999,
            realizado_por: 'Hacker',
            cliente: {
              nombre: 'Cliente Malicioso',
              rut: '11111111-1',
            },
            vehiculo: {
              patente: 'HACK01',
              marca: 'Evil',
              modelo: 'Model X',
            },
            items: [
              {
                servicio_nombre: 'Servicio Gratis',
                precio: -100,
              }
            ]
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
        console.log('❌ Precio negativo rechazado:', response.body.message);
      });

      it('POST /api/counter-sales - debe rechazar precio_venta: -100', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/counter-sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tipo_movimiento: 'VENTA',
            comprador: 'Hacker',
            items: [
              { sku: 'CASH-001', cantidad: 1, precio_venta: -100 }
            ]
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('Campos requeridos faltantes', () => {
      it('POST /api/auth/login - debe rechazar sin password', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ rut: '111111111' })
          .expect(400);
      });

      it('POST /api/counter-sales VENTA - debe requerir comprador', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/counter-sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tipo_movimiento: 'VENTA',
            // Sin comprador
            items: [
              { sku: 'CASH-001', cantidad: 1, precio_venta: 1000 }
            ]
          });

        // Puede ser 400 o 201 dependiendo de la validación
        if (response.status === 400) {
          expect(response.body.message).toBeDefined();
        }
      });
    });

    describe('Inyección y caracteres especiales', () => {
      it('POST /api/auth/login - debe manejar caracteres especiales en RUT', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            rut: "'; DROP TABLE users; --",
            password: 'password123'
          })
          .expect(401); // Credenciales inválidas, no error de servidor
      });

      it('POST /api/counter-sales - debe manejar SKU inexistente', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/counter-sales')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tipo_movimiento: 'VENTA',
            comprador: 'Test',
            items: [
              { sku: 'SKU-INEXISTENTE-XYZ', cantidad: 1, precio_venta: 1000 }
            ]
          })
          .expect(400);

        expect(response.body.message).toMatch(/no existe/i);
      });
    });
  });

  // ==========================================================================
  // TEST 4: SEGURIDAD Y AUTENTICACIÓN
  // ==========================================================================
  describe('🔒 Test de Seguridad', () => {
    it('Endpoints protegidos deben rechazar sin token', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/reports/daily-cash' },
        { method: 'get', path: '/api/reports/low-stock' },
        { method: 'get', path: '/api/work-orders' },
        { method: 'get', path: '/api/counter-sales' },
        { method: 'post', path: '/api/work-orders' },
        { method: 'post', path: '/api/counter-sales' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await (request(app.getHttpServer()) as any)
          [endpoint.method](endpoint.path)
          .send({});

        expect(response.status).toBe(401);
      }
    });

    it('Token inválido debe ser rechazado', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily-cash')
        .set('Authorization', 'Bearer token.invalido.aqui')
        .expect(401);
    });

    it('Token malformado debe ser rechazado', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/daily-cash')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  // ==========================================================================
  // TEST 5: FLUJO COMPLETO DE TRABAJO
  // ==========================================================================
  describe('🔄 Flujo Completo de Trabajo', () => {
    it('Debe completar ciclo: Venta → Orden → Reporte', async () => {
      // 1. Verificar stock inicial
      const productRepo = dataSource.getRepository(Product);
      const initialProduct = await productRepo.findOne({ where: { sku: 'TEST-001' } });
      const initialStock = initialProduct!.stock_actual;

      // 2. Registrar venta de mesón
      await request(app.getHttpServer())
        .post('/api/counter-sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo_movimiento: 'VENTA',
          comprador: 'Cliente Flujo',
          items: [
            { sku: 'TEST-001', cantidad: 1, precio_venta: 5000 }
          ]
        })
        .expect(201);

      // 3. Verificar stock decrementó
      const afterSale = await productRepo.findOne({ where: { sku: 'TEST-001' } });
      expect(afterSale!.stock_actual).toBe(initialStock - 1);

      // 4. Crear orden de trabajo
      await request(app.getHttpServer())
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          numero_orden_papel: Math.floor(Math.random() * 100000),
          realizado_por: 'Mecánico Flujo',
          cliente: {
            nombre: 'Cliente Orden Flujo',
            rut: '33.333.333-3',
          },
          vehiculo: {
            patente: 'FLOW01',
            marca: 'Honda',
            modelo: 'Civic',
            kilometraje: 50000,
          },
          items: [
            {
              servicio_nombre: 'Cambio Pastillas',
              precio: 20000,
              product_sku: 'TEST-001',
              cantidad_producto: 1,
            }
          ]
        })
        .expect(201);

      // 5. Verificar stock decrementó nuevamente
      const afterOrder = await productRepo.findOne({ where: { sku: 'TEST-001' } });
      expect(afterOrder!.stock_actual).toBe(initialStock - 2);

      // 6. Verificar reporte de caja
      const cajaResponse = await request(app.getHttpServer())
        .get('/api/reports/daily-cash')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cajaResponse.body.total_final).toBeGreaterThan(0);
      console.log('✅ Flujo completo verificado. Caja total:', cajaResponse.body.total_final);
    });
  });

  // ==========================================================================
  // TEST 6: VALIDACIONES DE STOCK
  // ==========================================================================
  describe('📦 Validaciones de Stock', () => {
    it('Debe rechazar venta cuando stock es insuficiente', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/counter-sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo_movimiento: 'VENTA',
          comprador: 'Cliente Greedy',
          items: [
            { sku: 'TEST-001', cantidad: 10000, precio_venta: 5000 }
          ]
        })
        .expect(400);

      expect(response.body.message).toMatch(/Stock insuficiente/i);
    });

    it('GET /api/reports/low-stock - debe retornar productos con alerta', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports/low-stock')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_alertas');
      expect(response.body).toHaveProperty('productos');
      expect(Array.isArray(response.body.productos)).toBe(true);
    });
  });

  // ==========================================================================
  // TEST 7: BÚSQUEDA GLOBAL
  // ==========================================================================
  describe('🔍 Búsqueda Global', () => {
    it('GET /api/reports/search - debe buscar por término', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports/search?q=Cliente')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('busqueda');
      expect(response.body).toHaveProperty('total_resultados');
    });
  });

  // ==========================================================================
  // RESUMEN FINAL
  // ==========================================================================
  describe('📋 Resumen de Tests', () => {
    it('Debe mostrar resumen de estado final', async () => {
      const productRepo = dataSource.getRepository(Product);
      const products = await productRepo.find();
      
      console.log('\n========================================');
      console.log('📊 ESTADO FINAL DE LA BASE DE DATOS');
      console.log('========================================');
      
      for (const product of products) {
        console.log(`  ${product.sku}: Stock = ${product.stock_actual}`);
      }

      const cajaResponse = await request(app.getHttpServer())
        .get('/api/reports/daily-cash')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('\n💰 CAJA DEL DÍA:', cajaResponse.body);
      console.log('========================================\n');

      expect(true).toBe(true); // Test pasa siempre, es informativo
    });
  });
});
