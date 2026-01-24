# 🔍 CODE REVIEW: Backend Taller Frenos Aguilera
## Documento Técnico para Revisión de Código y Lógica

**Fecha:** 24 de enero de 2026  
**Stack:** NestJS 11 + TypeORM + SQLite/PostgreSQL  
**Estado:** ✅ Build limpio, 37/37 tests passing

---

## 📑 Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Patrones de Diseño Utilizados](#2-patrones-de-diseño-utilizados)
3. [Lógica de Negocio por Módulo](#3-lógica-de-negocio-por-módulo)
4. [Sistema de Seguridad](#4-sistema-de-seguridad)
5. [Cobertura de Tests](#5-cobertura-de-tests)
6. [Puntos de Atención](#6-puntos-de-atención)
7. [Comandos de Desarrollo](#7-comandos-de-desarrollo)

---

## 1. Arquitectura General

### 1.1 Estructura de Carpetas

```
src/
├── main.ts                    # Bootstrap de la aplicación
├── app.module.ts              # Módulo raíz (importa todos los módulos)
├── seed.ts                    # Script de datos iniciales
│
├── auth/                      # 🔐 Autenticación JWT
│   ├── auth.module.ts
│   ├── auth.controller.ts     # /api/auth/login, /api/auth/register
│   ├── auth.service.ts        # Lógica de login/register
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   └── roles.decorator.ts         # @Roles(UserRole.ADMIN)
│   ├── guards/
│   │   ├── jwt-auth.guard.ts          # Valida JWT
│   │   └── roles.guard.ts             # Valida rol del usuario
│   ├── strategies/
│   │   └── jwt.strategy.ts            # Estrategia Passport
│   └── dto/
│       └── login.dto.ts
│
├── users/                     # 👤 Gestión de usuarios
│   ├── entities/
│   │   └── user.entity.ts     # id, rut, password (hash), nombre, role
│   └── enums/
│       └── user-role.enum.ts  # ADMIN | WORKER
│
├── products/                  # 📦 Inventario
│   ├── entities/
│   │   └── product.entity.ts  # sku, nombre, stock_actual, stock_minimo
│   └── dto/
│
├── purchases/                 # 🧾 Compras a proveedores (ADMIN only)
│   ├── entities/
│   │   ├── purchase.entity.ts
│   │   └── purchase-detail.entity.ts
│   └── purchases.service.ts   # ⚠️ LÓGICA CRÍTICA: aumenta stock
│
├── work-orders/               # 🔧 Órdenes de trabajo
│   ├── entities/
│   │   ├── work-order.entity.ts
│   │   └── work-order-detail.entity.ts
│   ├── constants/
│   │   └── services.constant.ts  # Catálogo de servicios
│   └── work-orders.service.ts    # ⚠️ LÓGICA CRÍTICA: descuenta stock
│
├── counter-sales/             # 💰 Ventas mostrador
│   ├── entities/
│   │   ├── counter-sale.entity.ts
│   │   └── counter-sale-detail.entity.ts
│   ├── enums/
│   │   └── movement-type.enum.ts  # VENTA | PERDIDA | USO_INTERNO
│   └── counter-sales.service.ts   # ⚠️ LÓGICA CRÍTICA: descuenta stock
│
├── reports/                   # 📊 Reportes
│   └── reports.service.ts     # Caja diaria, stock bajo, buscador
│
├── clients/                   # 👥 Clientes
├── vehicles/                  # 🚗 Vehículos
├── providers/                 # 🏭 Proveedores (ADMIN only)
└── categories/                # 🏷️ Categorías de productos
```

### 1.2 Flujo de Dependencias

```
                    ┌─────────────┐
                    │  AppModule  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌──────▼──────┐    ┌──────▼──────┐
   │AuthModule│      │WorkOrdersModule│  │PurchasesModule│
   └────┬────┘      └──────┬──────┘    └──────┬──────┘
        │                  │                  │
        │           ┌──────▼──────┐    ┌──────▼──────┐
        │           │ClientsModule│    │ProductsModule│
        │           │VehiclesModule│   │ProvidersModule│
        │           └─────────────┘    └─────────────┘
        │
   ┌────▼────┐
   │UsersModule│
   └─────────┘
```

---

## 2. Patrones de Diseño Utilizados

### 2.1 Repository Pattern (via TypeORM)

```typescript
// Inyección de DataSource para transacciones manuales
@Injectable()
export class WorkOrdersService {
  constructor(private dataSource: DataSource) {}
  
  async create(dto: CreateWorkOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      // Operaciones atómicas
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
}
```

**Ubicación:** `work-orders.service.ts`, `purchases.service.ts`, `counter-sales.service.ts`

### 2.2 DTO Pattern con Validación

```typescript
// class-validator + class-transformer
export class CreateWorkOrderDto {
  @IsInt()
  @Min(1)
  numero_orden_papel: number;

  @IsString()
  @IsNotEmpty()
  realizado_por: string;

  @ValidateNested()
  @Type(() => ClienteDto)
  cliente: ClienteDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
```

**Validación global en `main.ts`:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Elimina campos no declarados
  forbidNonWhitelisted: true, // Error si hay campos extra
  transform: true,            // Transforma tipos automáticamente
}));
```

### 2.3 Guard Pattern (Autenticación/Autorización)

```typescript
// Uso en Controller
@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)  // Orden importa!
@Roles(UserRole.ADMIN)                 // Solo ADMIN
export class PurchasesController {
  @Post()
  create(@Body() dto: CreatePurchaseDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.nombre);
  }
}
```

**Flujo de Guards:**
```
Request → JwtAuthGuard → RolesGuard → Controller
           (valida JWT)   (valida rol)
```

### 2.4 Decorator Pattern (Metadata)

```typescript
// current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;  // Poblado por JwtStrategy
  },
);

// roles.decorator.ts
export const Roles = (...roles: UserRole[]) => 
  SetMetadata('roles', roles);
```

### 2.5 Find-or-Create Pattern

```typescript
// Patrón repetido en work-orders.service.ts
let client = await queryRunner.manager.findOne(Client, {
  where: { rut: rutNormalizado },
});

if (!client) {
  client = new Client();
  client.nombre = dto.nombre;
  client.rut = rutNormalizado;
  await queryRunner.manager.save(client);
} else {
  // Actualizar datos existentes
  if (dto.telefono) client.telefono = dto.telefono;
  await queryRunner.manager.save(client);
}
```

---

## 3. Lógica de Negocio por Módulo

### 3.1 Purchases (Compras a Proveedores)

**Archivo:** `src/purchases/purchases.service.ts`

```
ENTRADA: CreatePurchaseDto
├── proveedor_nombre: string
├── tipo_documento: "FACTURA" | "INFORMAL"
├── numero_documento?: string
└── items[]: { sku, nombre, cantidad, precio_costo, precio_venta_sugerido }

PROCESO:
1. Find-or-Create Proveedor (por nombre)
2. Por cada item:
   ├── Find-or-Create Producto (por SKU)
   ├── SUMA stock: producto.stock_actual += cantidad
   └── Actualiza precio_venta del producto
3. Calcula montos:
   ├── monto_neto = Σ(cantidad × precio_costo)
   ├── monto_iva = (tipo === 'FACTURA') ? neto × 0.19 : 0
   └── monto_total = neto + iva
4. Auditoría: createdByName = usuario del JWT

SALIDA: Purchase con detalles y montos calculados
```

**Test relevante:** Sección "4. Compras y Stock" (líneas 244-410)

### 3.2 Work Orders (Órdenes de Trabajo)

**Archivo:** `src/work-orders/work-orders.service.ts`

```
ENTRADA: CreateWorkOrderDto
├── numero_orden_papel: number (único, del talonario físico)
├── realizado_por: string (mecánico)
├── cliente: { nombre, rut?, email?, telefono? }
├── vehiculo: { patente, marca, modelo, kilometraje? }
└── items[]: { servicio_nombre, precio, product_sku?, cantidad_producto? }

PROCESO (TRANSACCIÓN ATÓMICA):
1. Find-or-Create Cliente:
   ├── Normaliza RUT (quita puntos/guiones, uppercase)
   ├── Normaliza Email (lowercase, trim)
   ├── Busca por RUT → si no, busca por Email
   └── Si no existe → crea nuevo

2. Find-or-Create Vehículo:
   ├── Normaliza patente (uppercase, trim)
   ├── Si no existe → crea nuevo
   └── SIEMPRE actualiza kilometraje

3. Por cada item:
   ├── Crea WorkOrderDetail
   ├── Si tiene product_sku:
   │   ├── Busca producto
   │   ├── Valida stock >= cantidad
   │   ├── RESTA stock: producto.stock_actual -= cantidad
   │   └── Si stock insuficiente → BadRequestException (rollback)
   └── Suma al total

4. Auditoría: createdByName = usuario del JWT

ROLLBACK: Si cualquier paso falla, TODO se revierte
```

**Catálogo de servicios:** `src/work-orders/constants/services.constant.ts`
```typescript
export const WORK_ORDER_SERVICES = [
  'Cambio Pastillas',
  'Cambio Balatas',
  'Cambio Liquido',
  'Cambio Gomas',
  'Rectificado',
  'Sangrado',
  'Cambio Piola',
  'Revision',
  'Otros',
];
```

### 3.3 Counter Sales (Ventas Mostrador)

**Archivo:** `src/counter-sales/counter-sales.service.ts`

```
TIPOS DE MOVIMIENTO:
┌─────────────────┬──────────────┬─────────────┬──────────────┐
│ Tipo            │ Resta Stock  │ Suma a Caja │ Campos       │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│ VENTA           │ ✅ Sí        │ ✅ Sí       │ total_venta  │
│ PERDIDA         │ ✅ Sí        │ ❌ No       │ costo_perdida│
│ USO_INTERNO     │ ✅ Sí        │ ❌ No       │ -            │
└─────────────────┴──────────────┴─────────────┴──────────────┘

PROCESO:
1. Por cada item:
   ├── Busca producto por SKU
   ├── Valida stock >= cantidad
   ├── RESTA stock: producto.stock_actual -= cantidad
   └── Guarda snapshot de costos

2. Si tipo === VENTA:
   ├── total_venta = Σ(cantidad × precio_venta)
   └── comprador es OBLIGATORIO

3. Si tipo === PERDIDA:
   └── costo_perdida = Σ(cantidad × costo_producto)

4. Auditoría: createdByName = usuario del JWT
```

### 3.4 Reports (Reportes)

**Archivo:** `src/reports/reports.service.ts`

#### Stock Bajo
```typescript
async getLowStock(): Promise<LowStockReport> {
  return await this.productRepo.find({
    where: { stock_actual: LessThanOrEqual(Raw(alias => `${alias}."stock_minimo"`)) },
    relations: ['categoria'],
  });
}
// Retorna productos donde: stock_actual <= stock_minimo
```

#### Caja Diaria
```typescript
async getDailyCash(fecha?: string): Promise<DailyCashReport> {
  const targetDate = fecha || new Date().toISOString().split('T')[0];
  
  // 1. Suma de Órdenes de Trabajo
  const ordenes = await this.workOrderRepo.find({
    where: { fecha_ingreso: Between(startOfDay, endOfDay) }
  });
  const total_taller = ordenes.reduce((sum, o) => sum + o.total_cobrado, 0);
  
  // 2. Suma de Ventas Mostrador (SOLO tipo VENTA)
  const ventas = await this.counterSaleRepo.find({
    where: { 
      tipo_movimiento: MovementType.VENTA,
      fecha: Between(startOfDay, endOfDay)
    }
  });
  const total_meson = ventas.reduce((sum, v) => sum + v.total_venta, 0);
  
  return {
    fecha: targetDate,
    total_taller,
    cantidad_ordenes: ordenes.length,
    total_meson,
    cantidad_ventas_meson: ventas.length,
    total_final: total_taller + total_meson
  };
}
```

#### Buscador Global
```typescript
async globalSearch(query: string): Promise<SearchResults> {
  // Busca en: clientes (nombre, rut), vehículos (patente), órdenes (patente)
  // Usa ILIKE para búsqueda case-insensitive
}
```

---

## 4. Sistema de Seguridad

### 4.1 Autenticación JWT

**Flujo:**
```
1. POST /api/auth/login { rut, password }
2. AuthService valida RUT (normalizado) + bcrypt.compare(password)
3. Si válido → genera JWT con payload: { sub: id, nombre, role }
4. Cliente envía: Authorization: Bearer <token>
5. JwtStrategy extrae payload y adjunta a request.user
```

**JWT Strategy:** `src/auth/strategies/jwt.strategy.ts`
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      nombre: payload.nombre,
      role: payload.role,
    };
  }
}
```

### 4.2 Autorización por Roles

**RolesGuard:** `src/auth/guards/roles.guard.ts`
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true; // Sin @Roles = público (si pasó JwtAuthGuard)
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### 4.3 Matriz de Permisos

| Endpoint | ADMIN | WORKER |
|----------|-------|--------|
| POST /purchases | ✅ | ❌ 403 |
| GET /purchases | ✅ | ❌ 403 |
| GET /providers | ✅ | ❌ 403 |
| POST /work-orders | ✅ | ✅ |
| POST /counter-sales | ✅ | ✅ |
| GET /reports/* | ✅ | ✅ |
| GET /clients | ✅ | ✅ |

### 4.4 Auditoría

Todas las transacciones guardan:
- `createdByName`: Nombre del usuario (del JWT)
- `createdAt`: Timestamp automático
- `updatedAt`: Timestamp automático

```typescript
// En el service
order.createdByName = createdByName || 'SISTEMA';

// En el controller
@Post()
create(@Body() dto, @CurrentUser() user: User) {
  return this.service.create(dto, user.nombre);
}
```

---

## 5. Cobertura de Tests

### 5.1 Suite E2E

**Archivo:** `test/app.e2e-spec.ts` (667 líneas)

```
📊 Estadísticas:
├── Total tests: 37
├── Passing: 37 ✅
├── Tiempo: ~8 segundos
└── Cobertura funcional: Alta
```

### 5.2 Categorías de Tests

| Sección | Tests | Qué Valida |
|---------|-------|------------|
| 🔐 Autenticación | 7 | Login con/sin formato RUT, passwords incorrectos |
| 🔑 Tokens | 5 | JWT inválido, vacío, firma incorrecta |
| 🔒 Endpoints Protegidos | 8 | Todos requieren auth |
| 📦 Compras y Stock | 5 | Crear producto, aumentar stock, IVA |
| ✅ Validaciones | 2 | Items vacíos, proveedor vacío |
| 🛡️ Seguridad | 3 | SQL injection, campos extra, registro |
| 👮 Control de Roles | 4 | WORKER no puede crear compras |
| ⚡ Stress | 2 | Concurrencia, stock acumulativo |
| 📋 Resumen | 1 | Integridad de datos |

### 5.3 Tests Críticos

**1. Stock se incrementa con compras:**
```typescript
it('Compra AUMENTA el stock de producto existente', async () => {
  const stockBefore = before?.stock_actual || 0;
  // POST /purchases con 100 unidades
  const after = await productRepo.findOne({ where: { sku } });
  expect(after?.stock_actual).toBe(stockBefore + 100);
});
```

**2. IVA se calcula correctamente:**
```typescript
it('Compra calcula IVA correctamente para FACTURA', async () => {
  expect(res.body.monto_neto).toBe(100000);
  expect(res.body.monto_iva).toBe(19000);  // 19%
  expect(res.body.monto_total).toBe(119000);
});
```

**3. RBAC funciona:**
```typescript
it('WORKER no puede crear compras (solo ADMIN)', async () => {
  // Login como WORKER
  const res = await request(app.getHttpServer())
    .post('/api/purchases')
    .set('Authorization', `Bearer ${workerToken}`);
  expect(res.status).toBe(403); // Forbidden
});
```

**4. SQL Injection neutralizado:**
```typescript
it('SQL Injection en login es neutralizado', async () => {
  const attacks = ["' OR '1'='1", "'; DROP TABLE users; --"];
  for (const payload of attacks) {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ rut: payload, password: payload });
    expect([400, 401]).toContain(res.status);
  }
});
```

### 5.4 Ejecutar Tests

```bash
# Tests E2E completos
npm run test:e2e

# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov
```

---

## 6. Puntos de Atención

### 6.1 Transacciones Críticas

⚠️ **Los siguientes servicios usan transacciones manuales:**

| Servicio | Razón | Rollback |
|----------|-------|----------|
| `purchases.service.ts` | Crea proveedor + productos + stock | ✅ |
| `work-orders.service.ts` | Crea cliente + vehículo + descuenta stock | ✅ |
| `counter-sales.service.ts` | Descuenta stock de múltiples productos | ✅ |

**Patrón usado:**
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();
try {
  // ... operaciones
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### 6.2 Normalización de Datos

**RUT:** Se guarda sin puntos ni guiones, uppercase
```typescript
const rutNormalizado = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
// "12.345.678-9" → "123456789"
```

**Email:** Lowercase + trim
```typescript
const emailNormalizado = email.toLowerCase().trim();
```

**Patente:** Uppercase + trim
```typescript
const patenteNormalizada = patente.toUpperCase().trim();
```

### 6.3 Manejo de Errores de Duplicidad

```typescript
// Captura error de constraint único (PostgreSQL code 23505)
catch (error) {
  const dbError = error as { code?: string; detail?: string };
  if (dbError.code === '23505' && dbError.detail?.includes('numero_orden_papel')) {
    throw new BadRequestException(
      `El número de orden ${dto.numero_orden_papel} ya existe en el sistema.`
    );
  }
  throw error;
}
```

### 6.4 Validación de Stock

```typescript
if (product.stock_actual < cantidad) {
  throw new BadRequestException(
    `Stock insuficiente para ${product.nombre}. Quedan ${product.stock_actual}.`
  );
}
```

---

## 7. Comandos de Desarrollo

```bash
# Instalación
npm install

# Desarrollo
npm run start:dev       # Watch mode

# Build
npm run build

# Producción
npm run start:prod

# Tests
npm run test            # Unit tests
npm run test:e2e        # E2E tests (37 tests)
npm run test:cov        # Con cobertura

# Linting
npm run lint            # ESLint

# Seed de datos
npm run seed            # Crear datos iniciales

# Base de datos
# SQLite: taller.db (dev/test)
# PostgreSQL: configurar en .env (prod)
```

---

## ✅ Resumen para Revisión

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Arquitectura | ✅ | Módulos bien separados, dependencias claras |
| Patrones | ✅ | Repository, DTO, Guard, Decorator |
| Transacciones | ✅ | Atómicas con rollback |
| Seguridad | ✅ | JWT + RBAC + Auditoría |
| Validación | ✅ | class-validator + whitelist |
| Tests E2E | ✅ | 37/37 passing |
| Normalización | ✅ | RUT, Email, Patente |
| Manejo de errores | ✅ | Duplicados, stock insuficiente |

---

**Documento preparado para revisión de código**  
**Fecha:** 24 de enero de 2026
