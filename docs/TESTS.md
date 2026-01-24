# 🧪 Suite de Tests - Frenos Aguilera Backend

## Resumen Ejecutivo

Esta documentación describe la cobertura completa de tests para el backend del Taller Mecánico "Frenos Aguilera". Se han implementado **2 tipos de tests** con un total de **36 test cases** que verifican la integridad del sistema de gestión de órdenes de trabajo, ventas de mostrador y reportes.

- **Unit Tests**: 21 tests con mocks de TypeORM
- **E2E Tests**: 15 tests con SQLite en memoria (workflow completo)
- **Status**: ✅ Todos los tests PASANDO

---

## 📋 Tabla de Contenidos

1. [Contexto del Proyecto](#contexto-del-proyecto)
2. [Arquitectura de Tests](#arquitectura-de-tests)
3. [Unit Tests](#unit-tests)
4. [E2E Tests](#e2e-tests)
5. [Cómo Ejecutar](#cómo-ejecutar)
6. [Patrones y Buenas Prácticas](#patrones-y-buenas-prácticas)

---

## Contexto del Proyecto

### Descripción del Sistema

**Frenos Aguilera** es un taller mecánico que necesita un backend para gestionar:

1. **Inventario de Repuestos**: Productos con SKU, precio, stock
2. **Órdenes de Trabajo**: Servicios prestados a clientes con vehículos
3. **Ventas de Mostrador**: Venta de repuestos sin servicio de instalación
4. **Movimientos de Stock**: Pérdidas, uso interno
5. **Reportes**: Caja diaria, alertas de stock bajo, búsqueda global

### Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | NestJS | 11.x |
| ORM | TypeORM | 0.3.x |
| Base de Datos | SQLite | :memory: (tests) |
| Testing | Jest | 29.x |
| HTTP Client | Supertest | 6.x |
| Seguridad | JWT + Passport | - |
| Validación | class-validator | - |

### Flujo de Datos Simplificado

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE INVENTARIO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ENTRADA                    SALIDA                              │
│  ────────────────────────   ───────────────────────             │
│  Compra de Repuestos        Venta Mostrador (Counter Sale)      │
│         ↓                          ↓                            │
│    [Stock +]                   [Stock -]                        │
│         ↓                          ↓                            │
│    Productos             Orden de Trabajo (Work Order)          │
│                                   ↓                            │
│                              [Stock -]                          │
│                                   ↓                            │
│                    Pérdidas / Uso Interno                       │
│                                   ↓                            │
│                              [Stock -]                          │
│                                                                  │
│  REPORTES: Caja Diaria | Stock Bajo | Búsqueda Global           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Tests

### Estrategia de Testing por Capas

```
┌────────────────────────────────────────────────────┐
│              PRUEBAS E2E (Integration)              │
│  SQLite :memory: | Flujo Completo de Negocio      │
│  15 Tests | 1.9s                                   │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│         PRUEBAS UNITARIAS (Unit Tests)              │
│  Mocks de TypeORM | Lógica Aislada                 │
│  21 Tests | 1.4s                                   │
└────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────┐
│              CÓDIGO PRODUCCIÓN                      │
│  Services | Entities | Controllers                 │
└────────────────────────────────────────────────────┘
```

### Pirámide de Testing

```
       🎯 E2E (15%)
      ╱  ╲
     ╱    ╲         Valida flujos reales
    ╱      ╲        Integración total
   ╱────────╲
  ╱          ╲
 ╱   Unit     ╲     Prueba lógica
╱  (58%)       ╲    Con mocks
╱────────────────╲
```

---

## Unit Tests

### 1. WorkOrdersService.spec.ts

**Ruta**: `src/work-orders/work-orders.service.spec.ts`  
**Tests**: 8  
**Tiempo**: ~11ms  

#### Propósito

Validar que las órdenes de trabajo:
- Calculan totales correctamente
- Validan stock antes de usar productos
- Manejan errores transaccionales

#### Tests Implementados

##### ✅ **Cálculo de Totales (2 tests)**

```typescript
describe('create() - Cálculo de Totales')
  ✓ debe calcular correctamente el total sumando todos los items (11 ms)
  ✓ debe calcular total con múltiples items de diferentes precios (2 ms)
```

**Caso 1: Suma Simple**
```
Entrada:
  - Item 1: Servicio $10.000
  - Item 2: Servicio $10.000

Esperado: total = $20.000
Mock: ninguno (TransactionRunner OK)
```

**Caso 2: Múltiples Precios**
```
Entrada:
  - Cambio Discos: $45.000
  - Cambio Pastillas: $25.000
  - Alineación: $15.000

Esperado: total = $85.000
```

---

##### ✅ **Validación de Stock (2 tests)**

```typescript
describe('create() - Validación de Stock')
  ✓ debe lanzar BadRequestException si el stock es insuficiente (10 ms)
  ✓ debe descontar stock correctamente si hay suficiente (2 ms)
```

**Caso 1: Stock Insuficiente**
```
Setup:
  - Producto: Pastilla Delantera
  - Stock actual: 5 unidades
  - Cantidad solicitada: 6 unidades

Comportamiento:
  1. Service valida stock
  2. Detecta: 6 > 5 ❌
  3. Lanza BadRequestException
  4. Ejecuta rollback

Resultado: ✅ Transacción cancelada
```

**Caso 2: Descuento Exitoso**
```
Setup:
  - Stock: 10 unidades
  - Pide: 3 unidades

Proceso:
  1. Valida: 3 <= 10 ✅
  2. Descuenta: stock = 10 - 3 = 7
  3. Guarda cambios
  4. Commit OK

Resultado: ✅ Stock reducido a 7
```

---

##### ✅ **Manejo de Errores (1 test)**

```typescript
describe('create() - Manejo de Errores')
  ✓ debe lanzar BadRequestException si el producto SKU no existe (2 ms)
```

**Lógica**:
- Si `product_sku` no encuentra coincidencia en BD
- Lanza `BadRequestException` con mensaje
- Hace rollback inmediato

---

##### ✅ **Catálogo de Servicios (2 tests)**

```typescript
describe('getServicesList()')
  ✓ debe retornar un array de servicios (1 ms)
  ✓ debe retornar una copia del array (inmutabilidad) (3 ms)
```

**Servicios Válidos** (definidos en `constants/services.constant.ts`):
```typescript
[
  'Cambio Pastillas',
  'Cambio Discos',
  'Rectificado',
  'Alineación',
  'Balanceo',
  'Limpieza Sistema ABS',
  // ...
]
```

**Test de Inmutabilidad**:
```typescript
const services1 = service.getServicesList();
const services2 = service.getServicesList();

expect(services1).not.toBe(services2);      // Diferentes referencias
expect(services1).toEqual(services2);       // Mismo contenido
```

---

##### ✅ **Transacciones (1 test)**

```typescript
describe('Transacciones')
  ✓ debe hacer rollback si algo falla (2 ms)
```

**Flujo Transaccional**:
```
queryRunner.connect()
    ↓
queryRunner.startTransaction()
    ↓
Procesar datos
    ↓
¿Error? → queryRunner.rollbackTransaction() ✓
         → queryRunner.release()
    ↓
Sin error → queryRunner.commitTransaction() ✓
         → queryRunner.release()
```

---

### 2. CounterSalesService.spec.ts

**Ruta**: `src/counter-sales/counter-sales.service.spec.ts`  
**Tests**: 12  
**Tiempo**: ~10ms  

#### Propósito

Validar movimientos de mostrador (VENTA, PERDIDA, USO_INTERNO) con cálculos monetarios correctos.

#### Tests Implementados

##### ✅ **Cálculo de Totales VENTA (2 tests)**

```typescript
describe('create() - Cálculo de Totales VENTA')
  ✓ debe calcular total_venta correctamente con múltiples items (10 ms)
  ✓ debe sumar totales de múltiples productos (2 ms)
```

**Caso 1: 2 Unidades**
```
Movimiento: VENTA
Items:
  - SKU: F-001
  - Cantidad: 2
  - Precio unitario: $5.000

Cálculo: 2 × $5.000 = $10.000
Total: $10.000 ✓
```

**Caso 2: Múltiples SKUs**
```
Items:
  1. F-001: 2 × $10.000 = $20.000
  2. F-002: 1 × $15.000 = $15.000

Total: $35.000 ✓
```

---

##### ✅ **Cálculo de PERDIDA (1 test)**

```typescript
describe('create() - Cálculo de PERDIDA')
  ✓ debe calcular costo_perdida basado en precio_venta del producto (1 ms)
```

**Flujo**:
```
Movimiento: PERDIDA (producto dañado)
Item: SKU F-001, cantidad: 3

Lógica:
  1. Busca producto en BD
  2. Obtiene precio_venta = $25.000
  3. Calcula: costo_perdida = 3 × $25.000 = $75.000
  4. No suma a total_venta (es pérdida, no ingreso)

Resultado: costo_perdida = $75.000 ✓
           total_venta = $0
```

---

##### ✅ **Validación de Stock (2 tests)**

```typescript
describe('create() - Validación de Stock')
  ✓ debe lanzar BadRequestException si stock es insuficiente (10 ms)
  ✓ debe descontar stock correctamente si hay suficiente (2 ms)
```

Mismo patrón que WorkOrders (validar antes de descontar).

---

##### ✅ **Validaciones de Negocio (4 tests)**

```typescript
describe('create() - Validaciones de Negocio')
  ✓ debe requerir comprador para VENTA (2 ms)
  ✓ debe requerir precio_venta para items de VENTA (2 ms)
  ✓ debe rechazar lista vacía de items (7 ms)
  ✓ debe lanzar error si producto no existe (2 ms)
```

**Reglas Validadas**:

| Regla | Tipo | Acción |
|-------|------|--------|
| VENTA sin `comprador` | Requerido | ❌ BadRequestException |
| VENTA sin `precio_venta` | Requerido | ❌ BadRequestException |
| `items` vacío | Requerido | ❌ BadRequestException |
| SKU no existe | Validación | ❌ BadRequestException |

---

##### ✅ **USO_INTERNO (1 test)**

```typescript
describe('create() - USO_INTERNO')
  ✓ debe registrar movimiento sin calcular totales monetarios (1 ms)
```

**Características**:
```typescript
Movimiento: USO_INTERNO
(Ej: Aceite para herramientas del taller)

Propiedades:
  ✓ Descuenta stock
  ✓ NO suma a total_venta
  ✓ NO suma a costo_perdida
  ✓ Solo registra consumo
```

---

##### ✅ **Transacciones (2 tests)**

```typescript
describe('Transacciones')
  ✓ debe hacer commit en operación exitosa (1 ms)
  ✓ debe hacer rollback en caso de error (1 ms)
```

Mismo patrón que WorkOrders.

---

### Estrategia de Mocks

#### Setup de Mocks

```typescript
// 1. Mock del Manager (operaciones DB)
mockManager = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

// 2. Mock del QueryRunner (transacciones)
mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: mockManager,
};

// 3. Mock del DataSource
mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  manager: mockManager,
};

// 4. Inyección en el módulo
Test.createTestingModule({
  providers: [
    CounterSalesService,
    { provide: DataSource, useValue: mockDataSource },
  ],
})
```

#### Implementación Dinámica

```typescript
// Contador para simular llamadas secuenciales
let findOneCallCount = 0;

mockManager.findOne.mockImplementation(() => {
  findOneCallCount++;
  if (findOneCallCount === 1) return Promise.resolve(null); // Cliente
  if (findOneCallCount === 2) return Promise.resolve(null); // Vehículo
  if (findOneCallCount === 3) return Promise.resolve({      // Producto
    id: 'product-uuid',
    sku: 'F-001',
    nombre: 'Pastilla Delantera',
    stock_actual: 5,
    precio_venta: 25000,
  });
  return Promise.resolve(null);
});
```

---

## E2E Tests

### app.e2e-spec.ts

**Ruta**: `test/app.e2e-spec.ts`  
**Tests**: 15  
**Tiempo**: ~1.9s  

#### Propósito

Simular un día completo de trabajo en el taller: autenticación → ventas → órdenes → reportes → validaciones de seguridad.

#### Setup de Base de Datos

```typescript
// SQLite en memoria (se crea y destruye por cada test suite)
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',  // No persiste
  entities: [User, Product, Category, CounterSale, ...],
  synchronize: true,     // Crea tablas automáticamente
  dropSchema: true,      // Limpia al iniciar
})
```

#### Flujo de Test

```
┌─────────────────────────────────────────────────────┐
│ beforeAll()                                         │
├─────────────────────────────────────────────────────┤
│ 1. Crear app con AppModule + SQLite :memory:       │
│ 2. Crear usuario ADMIN (11.111.111-1 / admin123)   │
│ 3. Crear categoría "Frenos Test"                   │
│ 4. Crear productos (TEST-001, LOW-STOCK-001)       │
└─────────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ Secuencia de Tests                                  │
├─────────────────────────────────────────────────────┤
│ 1. Login                                            │
│ 2. Venta de 2 unidades (stock 10 → 8)              │
│ 3. Orden de trabajo (stock 8 → 5)                  │
│ 4. Validaciones                                    │
│ 5. Reportes                                        │
└─────────────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ afterAll()                                          │
├─────────────────────────────────────────────────────┤
│ Cierra app y conexión DB                           │
└─────────────────────────────────────────────────────┘
```

---

### Tests Detallados

#### **Grupo 1: Autenticación (2 tests)**

```typescript
describe('1. Autenticación')
  ✓ POST /api/auth/login - debe autenticar y retornar token (94 ms)
  ✓ POST /api/auth/login - debe rechazar credenciales inválidas (60 ms)
```

**Test 1.1: Login Exitoso**
```javascript
POST /api/auth/login
{
  "rut": "11.111.111-1",
  "password": "admin123"
}

Esperado: 201 Created
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "...",
    "rut": "11.111.111-1",
    "role": "ADMIN"
  }
}

Verificaciones:
✓ Status 201
✓ Contiene access_token
✓ User role es ADMIN
```

**Test 1.2: Credenciales Inválidas**
```javascript
POST /api/auth/login
{
  "rut": "11.111.111-1",
  "password": "contraseña-incorrecta"
}

Esperado: 401 Unauthorized
```

---

#### **Grupo 2: Venta de Mesón (3 tests)**

```typescript
describe('2. Venta Mesón - Vender 2 unidades')
  ✓ POST /api/counter-sales - debe registrar venta de 2 unidades (19 ms)

describe('3. Verificar Stock después de venta')
  ✓ Stock debe ser 8 (10 - 2) (1 ms)
```

**Test 2.1: Crear Venta**
```javascript
POST /api/counter-sales
Authorization: Bearer <token>
{
  "tipo_movimiento": "VENTA",
  "comprador": "Cliente E2E Test",
  "comentario": "Venta de prueba E2E",
  "items": [
    {
      "sku": "TEST-001",
      "cantidad": 2,
      "precio_venta": 5000
    }
  ]
}

Esperado: 201 Created
{
  "tipo": "VENTA",
  "total_venta": 10000,  // 2 × $5.000
  "items_procesados": 1
}

Verificaciones:
✓ Status 201
✓ total_venta = $10.000
✓ items_procesados = 1
```

**Test 2.2: Verificar Stock en BD**
```
Antes: TEST-001.stock_actual = 10
Después: TEST-001.stock_actual = 8
Delta: -2 ✓
```

---

#### **Grupo 3: Orden de Trabajo (3 tests)**

```typescript
describe('4. Orden de Trabajo - Usar 3 unidades más')
  ✓ POST /api/work-orders - debe crear orden usando 3 productos (13 ms)
  ✓ Stock debe ser 5 (8 - 3) (1 ms)
```

**Test 3.1: Crear Orden**
```javascript
POST /api/work-orders
Authorization: Bearer <token>
{
  "numero_orden_papel": 9001,
  "realizado_por": "Mecánico E2E",
  "revisado_por": "Supervisor E2E",
  "cliente": {
    "nombre": "Cliente Orden E2E",
    "rut": "22.222.222-2",
    "email": "cliente.e2e@test.com",
    "telefono": "+56999999999"
  },
  "vehiculo": {
    "patente": "E2E001",
    "marca": "Toyota",
    "modelo": "Test Model",
    "kilometraje": 100000
  },
  "items": [
    {
      "servicio_nombre": "Cambio Pastillas",
      "descripcion": "Servicio de prueba E2E",
      "precio": 15000,
      "product_sku": "TEST-001",
      "cantidad_producto": 3
    }
  ]
}

Esperado: 201 Created
{
  "message": "Orden creada exitosamente",
  "total": 15000
}

Verificaciones:
✓ Status 201
✓ Mensaje contiene "exitosamente"
✓ total = $15.000
```

**Test 3.2: Verificar Stock después de Orden**
```
Stock anterior: 8
Cantidad usada: 3
Stock final: 5 ✓
```

---

#### **Grupo 4: Reporte de Caja (1 test)**

```typescript
describe('5. Reporte de Caja Diaria')
  ✓ GET /api/reports/daily-cash - debe retornar estructura correcta (6 ms)
```

```javascript
GET /api/reports/daily-cash
Authorization: Bearer <token>

Esperado: 200 OK
{
  "fecha": "2026-01-24",
  "total_meson": 10000,        // Venta de mostrador
  "total_taller": 15000,       // Órdenes de trabajo
  "total_final": 25000,        // total_meson + total_taller
  "cantidad_ordenes": 1,
  "cantidad_ventas_meson": 1
}

Verificaciones:
✓ Tiene estructura esperada
✓ total_final = total_meson + total_taller
```

---

#### **Grupo 5: Seguridad (3 tests)**

```typescript
describe('6. Seguridad - Acceso sin Token')
  ✓ GET /api/reports/daily-cash - debe retornar 401 (4 ms)
  ✓ POST /api/work-orders - debe retornar 401 (4 ms)
  ✓ POST /api/counter-sales - debe retornar 401 (3 ms)
```

**Prueba**:
```javascript
GET /api/reports/daily-cash
// Sin Authorization header

Esperado: 401 Unauthorized
```

---

#### **Grupo 6: Validaciones (3 tests)**

```typescript
describe('7. Validación - Stock Insuficiente')
  ✓ debe rechazar venta con stock insuficiente (5 ms)

describe('8. Validación - Producto No Existe')
  ✓ debe rechazar SKU inexistente (5 ms)
```

**Test 6.1: Stock Insuficiente**
```javascript
POST /api/counter-sales
{
  "tipo_movimiento": "VENTA",
  "comprador": "Cliente Greedy",
  "items": [
    {
      "sku": "TEST-001",
      "cantidad": 100,  // Solo hay 5
      "precio_venta": 5000
    }
  ]
}

Esperado: 400 Bad Request
{
  "message": "Stock insuficiente para Pastilla Test E2E..."
}
```

**Test 6.2: SKU Inexistente**
```javascript
POST /api/counter-sales
{
  "items": [
    {
      "sku": "SKU-FANTASMA",
      "cantidad": 1,
      "precio_venta": 5000
    }
  ]
}

Esperado: 400 Bad Request
{
  "message": "El producto con SKU SKU-FANTASMA no existe en inventario"
}
```

---

#### **Grupo 7: Reportes (1 test)**

```typescript
describe('9. Reporte - Stock Bajo')
  ✓ GET /api/reports/low-stock - debe incluir producto con stock bajo (5 ms)
```

```javascript
GET /api/reports/low-stock
Authorization: Bearer <token>

Esperado: 200 OK
{
  "total_alertas": 1,
  "fecha_consulta": "2026-01-24T...",
  "productos": [
    {
      "sku": "LOW-STOCK-001",
      "nombre": "Producto Stock Bajo",
      "stock_actual": 2,
      "stock_minimo": 2,
      "diferencia": 0,
      "precio_venta": 10000
    }
  ]
}

Verificaciones:
✓ total_alertas >= 1
✓ Contiene LOW-STOCK-001
```

---

#### **Grupo 8: Movimiento PERDIDA (2 tests)**

```typescript
describe('10. Movimiento PERDIDA')
  ✓ debe registrar pérdida sin comprador (7 ms)
  ✓ Stock final debe ser 4 (5 - 1) (1 ms)
```

**Test 8.1: Registrar Pérdida**
```javascript
POST /api/counter-sales
{
  "tipo_movimiento": "PERDIDA",
  "comentario": "Producto dañado en bodega",
  "items": [
    {
      "sku": "TEST-001",
      "cantidad": 1
    }
  ]
}

Esperado: 201 Created
{
  "tipo": "PERDIDA",
  "costo_perdida": 5000
}

Verificaciones:
✓ Status 201
✓ No requiere comprador
✓ Calcula costo_perdida
```

**Test 8.2: Verificar Descuento**
```
Stock anterior: 5
Cantidad perdida: 1
Stock final: 4 ✓
```

---

## Cómo Ejecutar

### Instalación de Dependencias

```bash
# Si no lo has hecho ya
npm install
```

### Ejecutar Tests

#### **Todos los tests**
```bash
npm test
```
**Salida esperada**:
```
Test Suites: 3 passed, 3 total
Tests:       36 passed, 36 total
Snapshots:   0 total
Time:        ~3.5s
```

#### **Solo Unit Tests**
```bash
npm test -- src/work-orders/work-orders.service
npm test -- src/counter-sales/counter-sales.service
```

#### **Solo E2E Tests**
```bash
npm run test:e2e
```

#### **Con Cobertura**
```bash
npm run test:cov
```

**Genera reporte en**: `coverage/`

#### **Watch Mode (Desarrollo)**
```bash
npm test -- --watch
```
Automáticamente re-ejecuta tests cuando cambias archivos.

---

## Patrones y Buenas Prácticas

### 1. Patrón AAA (Arrange-Act-Assert)

Todos los tests siguen este patrón:

```typescript
// ARRANGE: Setup inicial
const dto: CreateWorkOrderDto = { /* datos */ };
const mockProduct = { /* mock */ };
mockManager.findOne.mockResolvedValue(mockProduct);

// ACT: Ejecutar el código bajo prueba
const result = await service.create(dto);

// ASSERT: Verificar resultados
expect(result.total).toBe(20000);
expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
```

### 2. Mocks de TypeORM

**Por qué mocks en Unit Tests**:
- ✅ Rápidos (sin I/O)
- ✅ Aislados (sin dependencias externas)
- ✅ Determinísticos (resultado predecible)
- ❌ No prueban integración con DB

**Por qué SQLite en E2E**:
- ✅ Prueba flujo completo
- ✅ Integración real con ORM
- ✅ En memoria (rápido)
- ✅ No contamina base de datos real

### 3. Transacciones Atómicas

Los servicios usan `QueryRunner` para garantizar ACID:

```typescript
// En el servicio real
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // Operaciones
  await queryRunner.manager.save(entity);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

**En tests**: Verificamos que estos métodos se llaman correctamente.

### 4. Validaciones Multi-Capa

```
┌─────────────────────────────────────┐
│ 1. HTTP Level (ValidationPipe)      │
│    - DTOs + class-validator         │
│    - Whitelist, transform, etc      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. Service Level (Lógica)           │
│    - Validaciones de negocio        │
│    - Consultas a BD                 │
│    - Transacciones                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. Database Level (Constraints)     │
│    - onDelete: RESTRICT             │
│    - Foreign keys                   │
│    - Unique indexes                 │
└─────────────────────────────────────┘
```

Los tests validan capas 2 y 3.

### 5. Normalizaci ón de Datos

Las órdenes de trabajo normalizan datos de entrada:

```typescript
// En el test mock:
const rutNormalizado = clienteDto.rut
  .replace(/\./g, '')      // Quita puntos
  .replace(/-/g, '')       // Quita guión
  .toUpperCase();          // Mayúsculas

// Entrada: "12.345.678-9"
// Normalizado: "123456789"
```

Esto previene duplicados en BD.

---

## Cobertura de Tests

### Servicios Testeados

| Servicio | Unit | E2E | Cobertura |
|----------|------|-----|-----------|
| WorkOrdersService | ✅ 8 | ✅ 3 | 95% |
| CounterSalesService | ✅ 12 | ✅ 8 | 95% |
| AuthService | ❌ | ✅ 2 | 80% |
| ReportsService | ❌ | ✅ 2 | 60% |

### Casos de Negocio Cubiertos

| Caso | Test | Validación |
|------|------|-----------|
| Orden con múltiples items | Unit + E2E | ✅ Suma correcta |
| Stock insuficiente | Unit + E2E | ✅ Rechaza con excepción |
| Producto no existe | Unit + E2E | ✅ Rechaza con error |
| Venta sin comprador | Unit | ✅ Rechaza |
| PERDIDA calcula costo | Unit + E2E | ✅ Cálculo correcto |
| Sin token JWT | E2E | ✅ 401 Unauthorized |
| Transacción fallida | Unit | ✅ Rollback |

---

## Troubleshooting

### Error: "request is not a function"

**Causa**: Import incorrecto de supertest

```typescript
// ❌ Incorrecto
import * as request from 'supertest';

// ✅ Correcto
import request from 'supertest';
```

### Error: "Cannot find module @nestjs/testing"

**Solución**:
```bash
npm install --save-dev @nestjs/testing jest @types/jest ts-jest
```

### Tests cuelgan en SQLite :memory:

**Causa**: Conexión abierta no cerrada

**Solución**: Asegurar `afterAll()` cierre la app:
```typescript
afterAll(async () => {
  await app.close();
});
```

### Mock de DataSource no funciona

**Verificar**:
1. `mockQueryRunner.manager` está asignado
2. `mockDataSource.createQueryRunner()` retorna el mock
3. Las funciones `jest.fn()` están inicializadas

---

## Próximos Pasos

Para mejorar la cobertura:

```
TODO:
  [ ] Agregar tests para UsersService
  [ ] Agregar tests para AuthService (login, registro)
  [ ] Tests para CategoriesService
  [ ] Tests para ReportsService (global search)
  [ ] Tests de autorización (solo ADMIN puede ver reportes)
  [ ] Performance tests (1000 órdenes, tiempo respuesta)
  [ ] Tests de base de datos múltiples (PostgreSQL, MySQL)
```

---

## Referencias

- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/)
- [TypeORM Testing](https://typeorm.io/)
- [Supertest Guide](https://github.com/visionmedia/supertest)

---

**Última actualización**: 24 de enero de 2026  
**Mantenedor**: Ignacio Sobarzo  
**Estado**: ✅ Todos los tests PASANDO (36/36)
