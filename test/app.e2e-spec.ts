/**
 * =============================================================================
 * E2E COMPREHENSIVE TESTS: Taller Frenos Aguilera
 * =============================================================================
 *
 * Suite de pruebas E2E completa (40+ tests)
 * Ejecutar: npm run test:e2e
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Product } from '../src/products/entities/product.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Purchase } from '../src/purchases/entities/purchase.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

describe('🧪 Taller Frenos Aguilera - Suite E2E Completa', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Usar el AppModule real para que los servicios compartan DataSource
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Obtener el DataSource que usa la app
    dataSource = moduleFixture.get(DataSource);

    // SEED: Limpiar y crear datos de prueba
    await seedTestData();
  });

  async function seedTestData() {
    const userRepo = dataSource.getRepository(User);
    const catRepo = dataSource.getRepository(Category);
    const productRepo = dataSource.getRepository(Product);

    // Limpiar usuarios existentes (excepto en producción)
    const existingAdmin = await userRepo.findOne({
      where: { rut: '111111111' },
    });
    if (!existingAdmin) {
      await userRepo.save({
        rut: '111111111',
        password: await bcrypt.hash('admin123', 10),
        nombre: 'Admin Test',
        role: UserRole.ADMIN,
        isActive: true,
      });
    }

    const existingWorker = await userRepo.findOne({
      where: { rut: '222222222' },
    });
    if (!existingWorker) {
      await userRepo.save({
        rut: '222222222',
        password: await bcrypt.hash('worker123', 10),
        nombre: 'Worker Test',
        role: UserRole.WORKER,
        isActive: true,
      });
    }

    // Categoría de prueba
    let category = await catRepo.findOne({ where: { nombre: 'Frenos E2E' } });
    if (!category) {
      category = await catRepo.save({
        nombre: 'Frenos E2E',
        descripcion: 'Categoría para tests E2E',
      });
    }

    // Producto de prueba
    const existingProduct = await productRepo.findOne({
      where: { sku: 'E2E-PASTILLA-001' },
    });
    if (!existingProduct) {
      await productRepo.save({
        sku: 'E2E-PASTILLA-001',
        nombre: 'Pastilla E2E',
        marca: 'TestBrand',
        precio_venta: 25000,
        stock_actual: 50,
        stock_minimo: 10,
        categoria: category,
      });
    }
  }

  afterAll(async () => {
    await app.close();
  });

  // ==========================================================================
  // 1. AUTENTICACIÓN
  // ==========================================================================
  describe('🔐 1. Autenticación', () => {
    it('ADMIN puede hacer login con RUT formateado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'admin123' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.access_token).toMatch(/^eyJ/);
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('WORKER puede hacer login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '22.222.222-2', password: 'worker123' })
        .expect(201);

      expect(res.body.user.role).toBe('WORKER');
    });

    it('Login con RUT sin formato también funciona', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '111111111', password: 'admin123' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
    });

    it('Password incorrecto retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'wrongpassword' })
        .expect(401);
    });

    it('RUT inexistente retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '99.999.999-9', password: 'cualquiera' })
        .expect(401);
    });

    it('Sin password retorna 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '111111111' })
        .expect(400);
    });

    it('Body vacío retorna 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  // ==========================================================================
  // 2. SEGURIDAD DE TOKENS
  // ==========================================================================
  describe('🔑 2. Seguridad de Tokens', () => {
    const PROTECTED = '/api/reports/daily-cash';

    it('Sin token → 401', async () => {
      await request(app.getHttpServer()).get(PROTECTED).expect(401);
    });

    it('Token inválido → 401', async () => {
      await request(app.getHttpServer())
        .get(PROTECTED)
        .set('Authorization', 'Bearer token-falso')
        .expect(401);
    });

    it('JWT con firma incorrecta → 401', async () => {
      const fakeJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.wrong';
      await request(app.getHttpServer())
        .get(PROTECTED)
        .set('Authorization', `Bearer ${fakeJwt}`)
        .expect(401);
    });

    it('Bearer vacío → 401', async () => {
      await request(app.getHttpServer())
        .get(PROTECTED)
        .set('Authorization', 'Bearer ')
        .expect(401);
    });

    it('Header Basic en vez de Bearer → 401', async () => {
      await request(app.getHttpServer())
        .get(PROTECTED)
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .expect(401);
    });
  });

  // ==========================================================================
  // 3. ENDPOINTS PROTEGIDOS
  // ==========================================================================
  describe('🔒 3. Endpoints Protegidos', () => {
    const endpoints = [
      { method: 'get', path: '/api/reports/daily-cash' },
      { method: 'get', path: '/api/reports/low-stock' },
      { method: 'get', path: '/api/work-orders' },
      { method: 'get', path: '/api/counter-sales' },
      { method: 'get', path: '/api/purchases' },
      { method: 'post', path: '/api/work-orders' },
      { method: 'post', path: '/api/counter-sales' },
      { method: 'post', path: '/api/auth/register' },
    ];

    it.each(endpoints)(
      '$method $path requiere autenticación',
      async ({ method, path }) => {
        const res = await (request(app.getHttpServer()) as any)
          [method](path)
          .send({});
        expect(res.status).toBe(401);
      },
    );
  });

  // ==========================================================================
  // 4. COMPRAS Y GESTIÓN DE STOCK
  // ==========================================================================
  describe('📦 4. Compras y Stock', () => {
    it('Compra AUMENTA el stock de producto existente', async () => {
      // 1. Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'admin123' });

      expect(loginRes.status).toBe(201);
      const token = loginRes.body.access_token;

      // 2. Verificar stock antes
      const productRepo = dataSource.getRepository(Product);
      const before = await productRepo.findOne({
        where: { sku: 'E2E-PASTILLA-001' },
      });
      const stockBefore = before?.stock_actual || 0;

      // 3. Hacer compra
      const purchaseRes = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          proveedor_nombre: 'Proveedor E2E Test',
          numero_documento: 'FAC-E2E-001',
          tipo_documento: 'FACTURA',
          items: [
            {
              sku: 'E2E-PASTILLA-001',
              nombre: 'Pastilla E2E',
              cantidad: 100,
              precio_costo: 15000,
              precio_venta_sugerido: 25000,
              marca: 'TestBrand',
            },
          ],
        });

      expect(purchaseRes.status).toBe(201);
      expect(purchaseRes.body.id).toBeDefined();

      // 4. Verificar stock después
      const after = await productRepo.findOne({
        where: { sku: 'E2E-PASTILLA-001' },
      });
      expect(after?.stock_actual).toBe(stockBefore + 100);
    });

    it('Compra CREA producto nuevo si SKU no existe', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'admin123' });

      const token = loginRes.body.access_token;
      const productRepo = dataSource.getRepository(Product);
      const sku = `NUEVO-${Date.now()}`;

      // Verificar que no existe
      const before = await productRepo.findOne({ where: { sku } });
      expect(before).toBeNull();

      // Crear por compra
      const res = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          proveedor_nombre: 'Nuevo Proveedor',
          numero_documento: 'FAC-NEW-001',
          tipo_documento: 'BOLETA',
          items: [
            {
              sku,
              nombre: 'Producto Creado por Compra',
              cantidad: 25,
              precio_costo: 5000,
              precio_venta_sugerido: 10000,
              marca: 'Nueva Marca',
            },
          ],
        });

      expect(res.status).toBe(201);

      const after = await productRepo.findOne({ where: { sku } });
      expect(after).not.toBeNull();
      expect(after?.stock_actual).toBe(25);
      expect(after?.precio_venta).toBe(10000);
    });

    it('Compra calcula IVA correctamente para FACTURA', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'admin123' });

      const res = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .send({
          proveedor_nombre: 'Test IVA',
          numero_documento: 'FAC-IVA-001',
          tipo_documento: 'FACTURA',
          items: [
            {
              sku: `IVA-${Date.now()}`,
              nombre: 'Producto IVA',
              cantidad: 10,
              precio_costo: 10000, // 10 * 10000 = 100000 neto
              precio_venta_sugerido: 15000,
              marca: 'Test',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.monto_neto).toBe(100000);
      expect(res.body.monto_iva).toBe(19000);
      expect(res.body.monto_total).toBe(119000);
    });

    it('Compra sin IVA para BOLETA', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'admin123' });

      const res = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .send({
          proveedor_nombre: 'Test Boleta',
          numero_documento: 'BOL-001',
          tipo_documento: 'BOLETA',
          items: [
            {
              sku: `BOL-${Date.now()}`,
              nombre: 'Producto Boleta',
              cantidad: 5,
              precio_costo: 20000, // 5 * 20000 = 100000
              precio_venta_sugerido: 30000,
              marca: 'Test',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.monto_iva).toBe(0);
      expect(res.body.monto_total).toBe(100000);
    });

    it('Compra sin token es rechazada', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/purchases')
        .send({
          proveedor_nombre: 'Test',
          tipo_documento: 'FACTURA',
          items: [
            {
              sku: 'X',
              nombre: 'X',
              cantidad: 1,
              precio_costo: 100,
              precio_venta_sugerido: 200,
              marca: 'X',
            },
          ],
        });
      expect(res.status).toBe(401);
    });
  });

  // ==========================================================================
  // 5. VALIDACIONES
  // ==========================================================================
  describe('✅ 5. Validaciones de Entrada', () => {
    it('Compra sin items es rechazada', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'admin123' });

      const res = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .send({
          proveedor_nombre: 'Test',
          numero_documento: 'X',
          tipo_documento: 'FACTURA',
          items: [],
        });

      expect(res.status).toBe(400);
    });

    it('Compra sin proveedor es rechazada', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '11.111.111-1', password: 'admin123' });

      const res = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .send({
          proveedor_nombre: '',
          tipo_documento: 'FACTURA',
          items: [
            {
              sku: 'X',
              nombre: 'X',
              cantidad: 1,
              precio_costo: 100,
              precio_venta_sugerido: 200,
              marca: 'X',
            },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  // 6. SEGURIDAD
  // ==========================================================================
  describe('🛡️ 6. Seguridad', () => {
    it('SQL Injection en login es neutralizado', async () => {
      const attacks = ["' OR '1'='1", "'; DROP TABLE users; --", "admin'--"];

      for (const payload of attacks) {
        const res = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ rut: payload, password: payload });
        expect([400, 401]).toContain(res.status);
      }
    });

    it('forbidNonWhitelisted rechaza campos extra', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          rut: '11.111.111-1',
          password: 'admin123',
          malicious: 'hacked',
        });
      expect(res.status).toBe(400);
    });

    it('Registro requiere autenticación', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          rut: '33.333.333-3',
          password: 'nuevo',
          nombre: 'Nuevo',
          role: 'WORKER',
        })
        .expect(401);
    });
  });

  // ==========================================================================
  // 7. RBAC - ROLES
  // ==========================================================================
  describe('👮 7. Control de Roles', () => {
    it('WORKER no puede crear compras (solo ADMIN)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '22.222.222-2', password: 'worker123' });

      expect(loginRes.status).toBe(201);

      const res = await request(app.getHttpServer())
        .post('/api/purchases')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .send({
          proveedor_nombre: 'Test',
          tipo_documento: 'FACTURA',
          items: [
            {
              sku: 'X',
              nombre: 'X',
              cantidad: 1,
              precio_costo: 100,
              precio_venta_sugerido: 200,
              marca: 'X',
            },
          ],
        });

      expect(res.status).toBe(403); // Forbidden
    });

    it('WORKER puede acceder a listar compras (GET)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ rut: '22.222.222-2', password: 'worker123' });

      const res = await request(app.getHttpServer())
        .get('/api/purchases')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`);

      expect(res.status).toBe(200);
    });
  });

  // ==========================================================================
  // 8. STRESS TEST
  // ==========================================================================
  describe('⚡ 8. Stress Test', () => {
    it('Múltiples logins concurrentes funcionan', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ rut: '11.111.111-1', password: 'admin123' }),
        );

      const results = await Promise.all(promises);
      results.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body.access_token).toBeDefined();
      });
    });

    it('Múltiples compras consecutivas actualizan stock', async () => {
      const productRepo = dataSource.getRepository(Product);
      const stressSku = `STRESS-${Date.now()}`;

      // Crear producto fresco
      await productRepo.save({
        sku: stressSku,
        nombre: 'Stress Test',
        marca: 'Test',
        precio_venta: 1000,
        stock_actual: 0,
        stock_minimo: 5,
      });

      // 5 compras de 10 unidades
      for (let i = 1; i <= 5; i++) {
        const loginRes = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ rut: '11.111.111-1', password: 'admin123' });

        const res = await request(app.getHttpServer())
          .post('/api/purchases')
          .set('Authorization', `Bearer ${loginRes.body.access_token}`)
          .send({
            proveedor_nombre: `Proveedor ${i}`,
            numero_documento: `STRESS-${i}`,
            tipo_documento: 'BOLETA',
            items: [
              {
                sku: stressSku,
                nombre: 'Stress Test',
                cantidad: 10,
                precio_costo: 500,
                precio_venta_sugerido: 1000,
                marca: 'Test',
              },
            ],
          });

        expect(res.status).toBe(201);
      }

      const product = await productRepo.findOne({ where: { sku: stressSku } });
      expect(product?.stock_actual).toBe(50); // 5 * 10
    });
  });

  // ==========================================================================
  // RESUMEN
  // ==========================================================================
  describe('📋 Resumen', () => {
    it('Base de datos tiene datos correctos', async () => {
      const productRepo = dataSource.getRepository(Product);
      const purchaseRepo = dataSource.getRepository(Purchase);
      const userRepo = dataSource.getRepository(User);

      const products = await productRepo.find();
      const purchases = await purchaseRepo.find();
      const users = await userRepo.find();

      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMEN FINAL DE LA BASE DE DATOS');
      console.log('='.repeat(60));
      console.log(`👤 Usuarios: ${users.length}`);
      console.log(`📦 Productos: ${products.length}`);
      console.log(`🧾 Compras: ${purchases.length}`);
      console.log('-'.repeat(60));
      products.slice(0, 10).forEach((p) => {
        console.log(`  ${p.sku}: ${p.stock_actual} unidades`);
      });
      console.log('='.repeat(60) + '\n');

      expect(products.length).toBeGreaterThan(0);
      expect(users.length).toBeGreaterThan(0);
    });
  });
});
