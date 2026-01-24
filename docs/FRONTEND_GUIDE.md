# 📋 INFORME DE FUNCIONALIDAD Y DATOS
## Backend Taller "Frenos Aguilera" - Guía Definitiva para Frontend

**Versión:** 1.0 (Code Freeze)  
**Fecha:** 24 de enero de 2026  
**Generado por:** Product Owner & Arquitecto de Software Senior  
**Estado:** ✅ LISTO PARA DESARROLLO FRONTEND

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Módulo Auth (Autenticación)](#1-módulo-auth-autenticación)
3. [Módulo Inventario/Proveedores](#2-módulo-inventarioproveedores)
4. [Módulo Clientes](#3-módulo-clientes)
5. [Módulo Órdenes de Trabajo](#4-módulo-órdenes-de-trabajo)
6. [Módulo Ventas Mostrador](#5-módulo-ventas-mostrador)
7. [Módulo Reportes](#6-módulo-reportes)
8. [Validación de Cobertura](#7-validación-de-cobertura)
9. [Anexos Técnicos](#8-anexos-técnicos)

---

## Resumen Ejecutivo

### 🎯 Lo Que Cubre el Sistema

| Flujo de Negocio | ¿Implementado? | Descripción |
|------------------|----------------|-------------|
| Login con RUT | ✅ | ADMIN y WORKER con JWT |
| Registro de compras | ✅ | Con cálculo automático de IVA |
| Gestión de inventario | ✅ | Stock, alertas, categorías |
| Órdenes de trabajo | ✅ | Cliente + Vehículo + Servicios |
| Ventas mostrador | ✅ | Ventas, pérdidas, uso interno |
| Caja diaria | ✅ | Suma de taller + mesón |
| Buscador global | ✅ | Clientes, patentes, órdenes |
| Auditoría | ✅ | Quién hizo qué y cuándo |

### 👥 Roles del Sistema

| Rol | Descripción | Cantidad de Cuentas |
|-----|-------------|---------------------|
| **ADMIN** | Dueña del taller (acceso total) | 1 cuenta individual |
| **WORKER** | Trabajadores (cuenta compartida) | 1 cuenta para todos |

---

## 1. Módulo Auth (Autenticación)

### 1.1 👥 ROLES Y VISIBILIDAD

#### ADMIN (Dueña)
```
✅ Login con RUT personal
✅ Ver y crear COMPRAS a proveedores
✅ Ver PROVEEDORES (información sensible)
✅ Crear órdenes de trabajo
✅ Registrar ventas mostrador
✅ Ver reportes de caja
✅ Registrar nuevos usuarios
```

#### WORKER (Cuenta Compartida)
```
✅ Login con RUT compartido (22.222.222-2)
✅ Crear órdenes de trabajo
✅ Registrar ventas mostrador
✅ Ver productos y stock
✅ Ver clientes (para buscar/crear)
✅ Ver reportes de caja
❌ NO puede ver proveedores
❌ NO puede ver/crear compras
❌ NO puede registrar usuarios
```

### 1.2 Sistema de Auditoría (Cuenta Compartida)

**Pregunta:** ¿Cómo sabe el sistema quién hizo la venta si usan la misma cuenta?

**Respuesta:** El nombre individual viene en el JWT:
```
Cuando "Ignacio" logea con cuenta compartida:
→ JWT payload: { nombre: "Ignacio", rol: "WORKER" }
→ Al crear orden: order.createdByName = "Ignacio"
→ BD guarda: createdByName = "Ignacio", createdAt = timestamp
```

**Campos de Auditoría por Entidad:**
| Entidad | createdByName | createdAt | updatedAt |
|---------|---------------|-----------|-----------|
| WorkOrder | ✅ | ✅ | ✅ |
| Purchase | ✅ | ✅ | ✅ |
| CounterSale | ✅ | ✅ | ✅ |

### 1.3 📦 ESTRUCTURA DE DATOS

#### Entidad: User
```typescript
{
  id: UUID (auto),
  rut: string (ÚNICO, sin puntos ni guion),
  password: string (hash bcrypt),
  nombre: string,
  role: 'ADMIN' | 'WORKER',
  isActive: boolean,
  createdAt: Date (auto)
}
```

#### DTO: Login
```typescript
POST /api/auth/login
{
  rut: string,        // Obligatorio (acepta con o sin formato)
  password: string    // Obligatorio
}
```

### 1.4 🎨 VISUALIZACIÓN FRONTEND

**Pantalla de Login:**
```
┌─────────────────────────────────────┐
│        FRENOS AGUILERA              │
│                                     │
│  RUT: [___________]                 │
│  Contraseña: [___________]          │
│                                     │
│  [     INGRESAR     ]               │
│                                     │
└─────────────────────────────────────┘

Validaciones:
- RUT: Acepta "12.345.678-9" o "123456789"
- Sistema normaliza automáticamente
```

---

## 2. Módulo Inventario/Proveedores

### 2.1 👥 ROLES Y VISIBILIDAD

| Acción | ADMIN | WORKER |
|--------|-------|--------|
| Ver productos | ✅ | ✅ |
| Crear productos (directo) | ✅ | ❌ |
| Ver proveedores | ✅ | ❌ |
| Crear compras | ✅ | ❌ |
| Ver historial compras | ✅ | ❌ |
| Eliminar compras | ✅ | ❌ |

**IMPORTANTE:** Los WORKERS ven productos porque necesitan seleccionar repuestos en órdenes de trabajo, pero NO ven costos de compra ni proveedores.

### 2.2 📦 ESTRUCTURA DE DATOS

#### Entidad: Product (Inventario)
```typescript
{
  id: UUID (auto),
  sku: string (ÚNICO, código maestro ej: "F-001"),
  nombre: string ("Pastilla de Freno Delantera"),
  marca: string | null ("Bosch", "Vier"),
  calidad: string | null ("Cerámica", "Semimetálica"),
  precio_venta: number (precio al público en CLP),
  stock_actual: number (default 0),
  stock_minimo: number (default 5, para alertas),
  categoria: Relación con Category,
  vehiculosCompatibles: Relación ManyToMany con Vehicle
}
```

#### Entidad: Provider (Proveedor)
```typescript
{
  id: UUID (auto),
  nombre: string (ÚNICO, ej: "Repuestos Don Gato"),
  compras: Relación con Purchase[]
}
```

#### Entidad: Purchase (Compra)
```typescript
{
  id: UUID (auto),
  numero_factura: string | null,
  fecha: Date (auto),
  monto_neto: number (suma sin IVA),
  monto_iva: number (19% si es FACTURA),
  monto_total: number (lo que se pagó),
  proveedor: Relación con Provider,
  detalles: PurchaseDetail[],
  // AUDITORÍA
  createdByName: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### Entidad: PurchaseDetail (Línea de Compra)
```typescript
{
  id: UUID (auto),
  cantidad: number,
  precio_costo_unitario: number (a cómo se compró),
  total_fila: number (cantidad × costo),
  producto: Relación con Product,
  compra: Relación con Purchase
}
```

#### Entidad: Category
```typescript
{
  id: UUID (auto),
  nombre: string (ÚNICO, ej: "Frenos", "Aceites"),
  productos: Product[]
}
```

### 2.3 DTO: Crear Compra
```typescript
POST /api/purchases (solo ADMIN)
{
  proveedor_nombre: string,           // Obligatorio
  numero_documento: string | null,    // Opcional (ej: "FAC-12345")
  tipo_documento: "FACTURA" | "INFORMAL",  // Obligatorio
  items: [
    {
      sku: string,                    // Obligatorio (código producto)
      nombre: string,                 // Obligatorio (nombre si es nuevo)
      marca: string | null,           // Opcional
      calidad: string | null,         // Opcional
      vehiculos_ids: string[],        // Opcional (UUIDs de vehículos)
      cantidad: number,               // Obligatorio
      precio_costo: number,           // Obligatorio (costo unitario)
      precio_venta_sugerido: number   // Obligatorio (precio venta)
    }
  ]
}
```

### 2.4 🔄 LÓGICA DE NEGOCIO: Compra a Proveedor

**¿Qué pasa cuando se guarda una compra?**

```
1. PROVEEDOR:
   ├─ Busca proveedor por nombre
   └─ Si no existe → lo CREA automáticamente

2. POR CADA ITEM:
   ├─ Busca producto por SKU
   ├─ Si no existe → CREA producto nuevo con los datos
   ├─ Si existe → ACTUALIZA precio_venta
   └─ SUMA stock: producto.stock_actual += item.cantidad

3. CÁLCULO DE MONTOS:
   ├─ Si tipo_documento = "FACTURA":
   │   ├─ monto_neto = Σ(cantidad × precio_costo)
   │   ├─ monto_iva = monto_neto × 0.19
   │   └─ monto_total = monto_neto + monto_iva
   └─ Si tipo_documento = "INFORMAL":
       ├─ monto_neto = Σ(cantidad × precio_costo)
       ├─ monto_iva = 0
       └─ monto_total = monto_neto

4. AUDITORÍA:
   └─ purchase.createdByName = nombre del usuario (del JWT)
```

### 2.5 🎨 VISUALIZACIÓN FRONTEND: Formulario de Compra

```
┌────────────────────────────────────────────────────────────┐
│ 📦 REGISTRAR COMPRA A PROVEEDOR                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Proveedor: [Repuestos Don Gato_____] (autocomplete)        │
│ Nº Documento: [FAC-12345___________] (opcional)            │
│ Tipo: (●) Factura  (○) Informal                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ ITEMS DE COMPRA                                            │
├──────┬───────────┬──────┬─────────┬─────────┬─────────────┤
│ SKU  │ Nombre    │ Cant │ Costo   │ P.Venta │ Subtotal    │
├──────┼───────────┼──────┼─────────┼─────────┼─────────────┤
│F-001 │ Pastillas │ 10   │ $15.000 │ $28.000 │ $150.000    │
│L-001 │ Líquido   │ 20   │ $3.000  │ $5.500  │ $60.000     │
├──────┴───────────┴──────┴─────────┴─────────┼─────────────┤
│                                    [+ Agregar Fila]        │
├────────────────────────────────────────────────────────────┤
│                              Neto:       $210.000          │
│                              IVA (19%):  $39.900           │
│                              TOTAL:      $249.900          │
├────────────────────────────────────────────────────────────┤
│               [CANCELAR]  [GUARDAR COMPRA]                 │
└────────────────────────────────────────────────────────────┘

Notas:
- SKU: Si no existe, crea producto nuevo
- Proveedor: Si no existe, lo crea
- IVA: Solo si tipo = FACTURA
```

---

## 3. Módulo Clientes

### 3.1 👥 ROLES Y VISIBILIDAD

| Acción | ADMIN | WORKER |
|--------|-------|--------|
| Ver clientes | ✅ | ✅ |
| Crear clientes | ✅ | ✅ (vía orden) |
| Buscar clientes | ✅ | ✅ |

**NOTA:** Los WORKERS pueden ver clientes porque necesitan buscarlos o crearlos al hacer órdenes de trabajo.

### 3.2 📦 ESTRUCTURA DE DATOS

#### Entidad: Client
```typescript
{
  id: UUID (auto),
  nombre: string,                    // OBLIGATORIO
  rut: string | null (ÚNICO),        // Opcional pero único si existe
  email: string | null (ÚNICO),      // Opcional pero único si existe
  telefono: string | null,           // Opcional
  ordenes: WorkOrder[]               // Historial de servicios
}
```

### 3.3 Campos del Formulario

| Campo | Tipo | ¿Obligatorio? | Validación |
|-------|------|---------------|------------|
| nombre | string | ✅ SÍ | No vacío |
| rut | string | ❌ NO | Único, se normaliza |
| email | string | ❌ NO | Único, formato email |
| telefono | string | ❌ NO | Ninguna especial |

### 3.4 🔄 LÓGICA DE NEGOCIO: Cliente

**Al crear una Orden de Trabajo:**
```
1. Busca cliente por RUT (si viene)
2. Si no encontró, busca por EMAIL (si viene)
3. Si no existe → CREA cliente nuevo
4. Si existe → ACTUALIZA datos (teléfono, etc.)
```

**NORMALIZACIÓN AUTOMÁTICA:**
- RUT: Se quitan puntos y guiones, se convierte a mayúsculas
- Email: Se convierte a minúsculas y se recorta espacios

### 3.5 🎨 VISUALIZACIÓN FRONTEND

**El cliente NO tiene pantalla propia.** Se crea/busca dentro del formulario de Orden de Trabajo:

```
┌─────────────────────────────────────┐
│ DATOS DEL CLIENTE                   │
├─────────────────────────────────────┤
│ Nombre*: [Juan Pérez González___]   │
│ RUT:     [12.345.678-9__________]   │
│ Email:   [juan@gmail.com________]   │
│ Teléfono:[+56912345678__________]   │
│                                     │
│ 💡 Si el RUT ya existe, se         │
│    actualizan los datos             │
└─────────────────────────────────────┘
```

---

## 4. Módulo Órdenes de Trabajo

### 4.1 👥 ROLES Y VISIBILIDAD

| Acción | ADMIN | WORKER |
|--------|-------|--------|
| Crear órdenes | ✅ | ✅ |
| Ver órdenes | ✅ | ✅ |
| Ver catálogo servicios | ✅ | ✅ |

### 4.2 📦 ESTRUCTURA DE DATOS

#### Entidad: WorkOrder
```typescript
{
  id: UUID (auto),
  numero_orden_papel: number (ÚNICO, del talonario físico),
  estado: string ("FINALIZADA" | "EN_PROCESO" | "CANCELADA"),
  fecha_ingreso: Date (auto),
  total_cobrado: number (suma de todos los items),
  realizado_por: string (mecánico que hizo el trabajo),
  revisado_por: string | null (supervisor),
  
  // SNAPSHOT DEL VEHÍCULO
  patente_vehiculo: string (guardada directamente),
  kilometraje: number | null,
  
  // RELACIONES
  cliente: Client,
  detalles: WorkOrderDetail[],
  
  // AUDITORÍA
  createdByName: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### Entidad: WorkOrderDetail
```typescript
{
  id: UUID (auto),
  servicio_nombre: string ("Cambio Pastillas", etc.),
  descripcion: string | null (comentario del mecánico),
  precio: number (lo cobrado por este servicio),
  
  // RELACIONES
  workOrder: WorkOrder,
  producto: Product | null (si usaron repuesto del inventario)
}
```

#### Entidad: Vehicle
```typescript
{
  id: UUID (auto),
  patente: string (ÚNICA, ej: "ABCD12"),
  marca: string,
  modelo: string,
  anio: number | null,
  kilometraje: number | null,
  productosCompatibles: Product[] (ManyToMany)
}
```

### 4.3 DTO: Crear Orden de Trabajo

```typescript
POST /api/work-orders
{
  numero_orden_papel: number,         // OBLIGATORIO (del talonario)
  realizado_por: string,              // OBLIGATORIO (mecánico)
  revisado_por: string | null,        // Opcional (supervisor)
  
  cliente: {
    nombre: string,                   // OBLIGATORIO
    rut: string | null,               // Opcional
    email: string | null,             // Opcional
    telefono: string | null           // Opcional
  },
  
  vehiculo: {
    patente: string,                  // OBLIGATORIO
    marca: string,                    // OBLIGATORIO
    modelo: string,                   // OBLIGATORIO
    kilometraje: number | null        // Opcional
  },
  
  items: [
    {
      servicio_nombre: string,        // OBLIGATORIO (del catálogo)
      descripcion: string | null,     // Opcional (comentario)
      precio: number,                 // OBLIGATORIO (>= 0)
      product_sku: string | null,     // Opcional (descuenta stock)
      cantidad_producto: number       // Default 1
    }
  ]
}
```

### 4.4 Catálogo de Servicios

```typescript
GET /api/work-orders/services-catalog

Retorna:
[
  "Cambio Pastillas",
  "Cambio Balatas",
  "Cambio Liquido",
  "Cambio Gomas",
  "Rectificado",
  "Sangrado",
  "Cambio Piola",
  "Revision",
  "Otros"
]
```

### 4.5 🔄 LÓGICA DE NEGOCIO: Orden de Trabajo

**¿Qué pasa cuando se guarda una orden?**

```
1. CLIENTE (Find or Create):
   ├─ Normaliza RUT y Email
   ├─ Busca por RUT (si viene)
   ├─ Si no encuentra, busca por Email
   ├─ Si no existe → CREA cliente
   └─ Si existe → ACTUALIZA datos (teléfono, etc.)

2. VEHÍCULO (Find or Create):
   ├─ Normaliza patente (mayúsculas, sin espacios)
   ├─ Busca por patente
   ├─ Si no existe → CREA vehículo
   └─ ACTUALIZA kilometraje (siempre al nuevo valor)

3. POR CADA ITEM:
   ├─ Crea WorkOrderDetail
   ├─ Si tiene product_sku:
   │   ├─ Busca producto por SKU
   │   ├─ Valida stock suficiente
   │   └─ RESTA stock: producto.stock_actual -= cantidad
   └─ Suma al total: orden.total_cobrado += item.precio

4. AUDITORÍA:
   └─ order.createdByName = nombre del usuario (del JWT)

5. TRANSACCIÓN:
   └─ TODO es atómico: si algo falla, nada se guarda
```

### 4.6 🎨 VISUALIZACIÓN FRONTEND: Formulario de Orden

**Recomendación:** Formulario tipo Wizard con 3 pasos:

```
┌────────────────────────────────────────────────────────────┐
│ 📋 NUEVA ORDEN DE TRABAJO                                  │
│                                                            │
│ [PASO 1] ────○──── [PASO 2] ────○──── [PASO 3]            │
│ Cliente/Auto       Servicios          Resumen              │
└────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                         PASO 1: Cliente y Vehículo
═══════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────┐
│ Nº ORDEN (talonario)*: [1547____]                          │
│                                                            │
│ ─── CLIENTE ───                                            │
│ Nombre*: [__________________________]                      │
│ RUT:     [____________] Email: [____________________]      │
│ Teléfono: [____________]                                   │
│                                                            │
│ ─── VEHÍCULO ───                                           │
│ Patente*: [ABCD12] Marca*: [Toyota___] Modelo*: [Yaris__] │
│ Kilometraje: [85000______]                                 │
│                                                            │
│ ─── TRABAJO ───                                            │
│ Realizado por*: [Carlos González____]                      │
│ Revisado por:   [Pedro Supervisor___]                      │
│                                                            │
│                              [SIGUIENTE →]                 │
└────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                         PASO 2: Servicios
═══════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────┐
│ SERVICIOS REALIZADOS                                       │
├────────────────────────────────────────────────────────────┤
│ ☑ Cambio Pastillas   ☐ Cambio Balatas   ☐ Cambio Liquido  │
│ ☐ Cambio Gomas       ☑ Rectificado      ☐ Sangrado        │
│ ☐ Cambio Piola       ☐ Revision         ☐ Otros           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ DETALLE DE SERVICIOS SELECCIONADOS:                        │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Servicio: Cambio Pastillas                             │ │
│ │ Descripción: [Pastillas delanteras cerámicas Bosch__] │ │
│ │ Precio cobrado: [$45.000_____]                         │ │
│ │ ¿Usó repuesto? ☑ Sí  SKU: [F-001] Cant: [1]           │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Servicio: Rectificado                                  │ │
│ │ Descripción: [Rectificado de disco delantero________] │ │
│ │ Precio cobrado: [$25.000_____]                         │ │
│ │ ¿Usó repuesto? ☐ No                                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│              [← ANTERIOR]      [SIGUIENTE →]               │
└────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
                         PASO 3: Resumen
═══════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────┐
│ RESUMEN DE LA ORDEN #1547                                  │
├────────────────────────────────────────────────────────────┤
│ Cliente: Juan Pérez (12.345.678-9)                         │
│ Vehículo: ABCD12 - Toyota Yaris (85.000 km)               │
│ Mecánico: Carlos González                                  │
│                                                            │
│ SERVICIOS:                                                 │
│ ├─ Cambio Pastillas .................... $45.000          │
│ │   └─ F-001 Pastilla Bosch (1 und) → Stock: 10 → 9      │
│ └─ Rectificado ......................... $25.000          │
│                                                            │
│ ════════════════════════════════════════════════           │
│ TOTAL A COBRAR:                          $70.000           │
│ ════════════════════════════════════════════════           │
│                                                            │
│              [← ANTERIOR]      [GUARDAR ORDEN]             │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Módulo Ventas Mostrador

### 5.1 👥 ROLES Y VISIBILIDAD

| Acción | ADMIN | WORKER |
|--------|-------|--------|
| Crear movimientos | ✅ | ✅ |
| Ver movimientos | ✅ | ✅ |
| Filtrar por tipo | ✅ | ✅ |

### 5.2 📦 ESTRUCTURA DE DATOS

#### Entidad: CounterSale
```typescript
{
  id: UUID (auto),
  tipo_movimiento: "VENTA" | "PERDIDA" | "USO_INTERNO",
  fecha: Date (auto),
  total_venta: number (solo si es VENTA),
  costo_perdida: number (solo si es PERDIDA),
  comentario: string | null,
  comprador: string | null (solo si es VENTA),
  detalles: CounterSaleDetail[],
  
  // AUDITORÍA
  createdByName: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### Entidad: CounterSaleDetail
```typescript
{
  id: UUID (auto),
  cantidad: number,
  precio_venta_unitario: number (solo si es VENTA),
  costo_producto: number (costo al momento del movimiento),
  total_fila: number (cantidad × precio si es VENTA),
  
  // RELACIONES
  counterSale: CounterSale,
  producto: Product
}
```

### 5.3 Tipos de Movimiento

```typescript
enum MovementType {
  VENTA = "VENTA",           // Cliente compra repuesto SIN instalación
  PERDIDA = "PERDIDA",       // Producto dañado/roto/robado
  USO_INTERNO = "USO_INTERNO" // Consumo del taller (ej: aceite)
}
```

### 5.4 DTO: Crear Movimiento

```typescript
POST /api/counter-sales
{
  tipo_movimiento: "VENTA" | "PERDIDA" | "USO_INTERNO",  // OBLIGATORIO
  comprador: string | null,     // OBLIGATORIO si VENTA
  comentario: string | null,    // Opcional
  items: [
    {
      sku: string,              // OBLIGATORIO
      cantidad: number,         // OBLIGATORIO (>= 1)
      precio_venta: number      // OBLIGATORIO si VENTA
    }
  ]
}
```

### 5.5 🔄 LÓGICA DE NEGOCIO: Movimientos

**¿Qué pasa cuando se registra cada tipo?**

```
┌─────────────────────────────────────────────────────────────┐
│                         VENTA                               │
├─────────────────────────────────────────────────────────────┤
│ 1. Valida stock suficiente                                  │
│ 2. RESTA stock: producto.stock_actual -= cantidad           │
│ 3. Calcula: total_venta = Σ(cantidad × precio_venta)       │
│ 4. Guarda nombre del comprador                              │
│ 5. SUMA a la caja diaria ✅                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         PÉRDIDA                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Valida stock suficiente                                  │
│ 2. RESTA stock: producto.stock_actual -= cantidad           │
│ 3. Calcula: costo_perdida = Σ(cantidad × precio_costo)     │
│ 4. total_venta = 0 (no genera ingreso)                      │
│ 5. NO suma a caja ❌ (solo registra la pérdida)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       USO_INTERNO                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Valida stock suficiente                                  │
│ 2. RESTA stock: producto.stock_actual -= cantidad           │
│ 3. total_venta = 0                                          │
│ 4. costo_perdida = 0                                        │
│ 5. NO suma a caja ❌                                        │
└─────────────────────────────────────────────────────────────┘
```

### 5.6 🎨 VISUALIZACIÓN FRONTEND

```
┌────────────────────────────────────────────────────────────┐
│ 💰 MOVIMIENTO DE INVENTARIO                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Tipo de Movimiento:                                        │
│ (●) Venta al público  (○) Pérdida  (○) Uso interno        │
│                                                            │
│ ─────────────────────────────────────────────────          │
│ [Si es VENTA se muestra:]                                  │
│ Nombre Comprador*: [Juan Pérez (walk-in)______]           │
│ ─────────────────────────────────────────────────          │
│                                                            │
│ PRODUCTOS:                                                 │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ SKU*: [F-001___] (autocomplete)                        │ │
│ │ Producto: Pastilla de Freno Delantera                  │ │
│ │ Stock disponible: 10 unidades                          │ │
│ │ Cantidad*: [2____]                                      │ │
│ │ [Si es VENTA] Precio Venta*: [$28.000___]             │ │
│ │ Subtotal: $56.000                                      │ │
│ └────────────────────────────────────────────────────────┘ │
│                                     [+ Agregar Producto]   │
│                                                            │
│ Comentario: [Cliente compró sin instalación___________]   │
│                                                            │
│ ═══════════════════════════════════════════════════════    │
│ [Si es VENTA]     TOTAL A COBRAR:     $56.000              │
│ [Si es PÉRDIDA]   COSTO PERDIDO:      $30.000              │
│ ═══════════════════════════════════════════════════════    │
│                                                            │
│                [CANCELAR]  [REGISTRAR MOVIMIENTO]          │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Módulo Reportes

### 6.1 👥 ROLES Y VISIBILIDAD

| Reporte | ADMIN | WORKER |
|---------|-------|--------|
| Stock bajo | ✅ | ✅ |
| Caja diaria | ✅ | ✅ |
| Buscador global | ✅ | ✅ |

### 6.2 Endpoints Disponibles

#### GET /api/reports/low-stock
```typescript
Respuesta:
{
  total_alertas: number,
  fecha_consulta: string,
  productos: [
    {
      id: string,
      sku: string,
      nombre: string,
      marca: string,
      stock_actual: number,
      stock_minimo: number,
      diferencia: number,    // cuántos faltan
      categoria: string,
      precio_venta: number
    }
  ]
}
```

#### GET /api/reports/daily-cash
```typescript
Query: ?fecha=2026-01-24 (opcional, default: hoy)

Respuesta:
{
  fecha: string,
  total_taller: number,         // Suma de WorkOrders
  cantidad_ordenes: number,     // Cantidad de WorkOrders
  total_meson: number,          // Suma de CounterSales (VENTA)
  cantidad_ventas_meson: number,// Cantidad de ventas mostrador
  total_final: number           // total_taller + total_meson
}
```

#### GET /api/reports/search
```typescript
Query: ?q=Juan (mínimo 2 caracteres)

Respuesta:
{
  busqueda: string,
  total_resultados: number,
  clientes: [
    { id, nombre, rut, telefono, email, cantidad_ordenes }
  ],
  vehiculos: [
    { id, patente, marca, modelo, anio }
  ],
  ordenes_recientes: [
    { id, numero_orden, patente, cliente_nombre, fecha, total, estado }
  ]
}
```

### 6.3 🎨 VISUALIZACIÓN FRONTEND

**Dashboard Principal:**
```
┌────────────────────────────────────────────────────────────┐
│ 📊 DASHBOARD - FRENOS AGUILERA                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🔍 Buscar: [____________________] [🔍]                     │
│                                                            │
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │ 💰 CAJA HOY      │  │ ⚠️ STOCK BAJO    │                │
│ │                  │  │                  │                │
│ │ Taller: $350.000 │  │ 5 productos      │                │
│ │ Mesón:  $85.000  │  │ requieren        │                │
│ │ ───────────────  │  │ reposición       │                │
│ │ TOTAL: $435.000  │  │                  │                │
│ │                  │  │ [Ver Alertas →]  │                │
│ └──────────────────┘  └──────────────────┘                │
│                                                            │
│ ACCIONES RÁPIDAS:                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ 📋 Nueva     │ │ 💰 Venta     │ │ 📦 Nueva     │        │
│ │ Orden        │ │ Mostrador    │ │ Compra*      │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                   *Solo visible para ADMIN │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Validación de Cobertura

### 7.1 ¿Cubre la Realidad de un Taller Mecánico?

| Necesidad Real | ¿Cubierto? | Implementación |
|---------------|------------|----------------|
| Registrar cliente nuevo | ✅ | Auto al crear orden |
| Historial por patente | ✅ | Buscador global |
| Historial por cliente | ✅ | Buscador global |
| Descuento automático de stock | ✅ | En órdenes y ventas |
| Alerta de stock bajo | ✅ | Reporte low-stock |
| Caja diaria | ✅ | Reporte daily-cash |
| Compras con IVA | ✅ | tipo_documento |
| Pérdidas/merma | ✅ | CounterSale PERDIDA |
| Múltiples servicios por orden | ✅ | Array de items |
| Catálogo de servicios fijo | ✅ | services-catalog |
| Auditoría (quién hizo qué) | ✅ | createdByName |
| Compatibilidad producto-vehículo | ✅ | ManyToMany |

### 7.2 ¿Falta Algo Crítico?

| Característica | Estado | Comentario |
|---------------|--------|------------|
| Cotizaciones/Presupuestos | ❌ No implementado | Futuro: crear estado "PRESUPUESTO" |
| Garantías | ❌ No implementado | Futuro: campo fecha_garantia_vence |
| Fotos del trabajo | ❌ No implementado | Requiere storage de archivos |
| Agenda/Citas | ❌ No implementado | Requiere módulo calendario |
| Facturación electrónica | ❌ No implementado | Requiere integración SII |
| Múltiples sucursales | ❌ No implementado | Actualmente 1 taller |

**CONCLUSIÓN:** Para un taller pequeño-mediano de frenos, **el sistema está COMPLETO** y cubre el flujo diario de operación. Las características faltantes son mejoras futuras.

---

## 8. Anexos Técnicos

### 8.1 Mapa de Endpoints

```
AUTH
├── POST /api/auth/login          → Login con RUT
└── POST /api/auth/register       → Crear usuario (solo ADMIN)

PRODUCTS
├── GET  /api/products            → Listar productos
├── POST /api/products            → Crear producto
├── GET  /api/products/:id        → Ver producto
├── PATCH /api/products/:id       → Actualizar producto
└── DELETE /api/products/:id      → Eliminar producto

CATEGORIES
├── GET  /api/categories          → Listar categorías
├── POST /api/categories          → Crear categoría
├── GET  /api/categories/:id      → Ver categoría
├── PATCH /api/categories/:id     → Actualizar categoría
└── DELETE /api/categories/:id    → Eliminar categoría

PROVIDERS (solo ADMIN)
├── GET  /api/providers           → Listar proveedores
├── POST /api/providers           → Crear proveedor
├── GET  /api/providers/:id       → Ver proveedor
├── PATCH /api/providers/:id      → Actualizar proveedor
└── DELETE /api/providers/:id     → Eliminar proveedor

PURCHASES (solo ADMIN)
├── GET  /api/purchases           → Listar compras
├── POST /api/purchases           → Registrar compra
└── DELETE /api/purchases/:id     → Eliminar compra

CLIENTS
├── GET  /api/clients             → Listar clientes
└── POST /api/clients             → Crear cliente

VEHICLES
├── GET  /api/vehicles            → Listar vehículos
├── POST /api/vehicles            → Crear vehículo
├── GET  /api/vehicles/:id        → Ver vehículo
├── PATCH /api/vehicles/:id       → Actualizar vehículo
└── DELETE /api/vehicles/:id      → Eliminar vehículo

WORK-ORDERS
├── GET  /api/work-orders                → Listar órdenes
├── POST /api/work-orders                → Crear orden
└── GET  /api/work-orders/services-catalog → Catálogo servicios

COUNTER-SALES
├── GET  /api/counter-sales       → Listar movimientos (?tipo=VENTA)
└── POST /api/counter-sales       → Registrar movimiento

REPORTS
├── GET  /api/reports/low-stock   → Productos con stock bajo
├── GET  /api/reports/daily-cash  → Caja diaria (?fecha=YYYY-MM-DD)
└── GET  /api/reports/search      → Buscador global (?q=texto)

USERS
├── GET  /api/users               → Listar usuarios
├── PATCH /api/users/change-password → Cambiar contraseña
└── DELETE /api/users/:id         → Eliminar usuario
```

### 8.2 Campos Obligatorios por Formulario

#### Orden de Trabajo
```
✅ numero_orden_papel (del talonario)
✅ realizado_por (mecánico)
✅ cliente.nombre
✅ vehiculo.patente
✅ vehiculo.marca
✅ vehiculo.modelo
✅ items[].servicio_nombre
✅ items[].precio
```

#### Compra a Proveedor
```
✅ proveedor_nombre
✅ tipo_documento (FACTURA/INFORMAL)
✅ items[].sku
✅ items[].nombre
✅ items[].cantidad
✅ items[].precio_costo
✅ items[].precio_venta_sugerido
```

#### Venta Mostrador
```
✅ tipo_movimiento
✅ comprador (solo si VENTA)
✅ items[].sku
✅ items[].cantidad
✅ items[].precio_venta (solo si VENTA)
```

### 8.3 Swagger/OpenAPI

La documentación interactiva está disponible en:
```
http://localhost:3000/docs
```

---

## ✅ Conclusión

El backend de Frenos Aguilera está **100% listo** para el desarrollo frontend. Cubre:

1. ✅ **Autenticación** con roles ADMIN/WORKER
2. ✅ **Inventario completo** con stock, alertas y categorías
3. ✅ **Compras** con cálculo automático de IVA
4. ✅ **Órdenes de trabajo** con cliente, vehículo y servicios
5. ✅ **Ventas mostrador** con tipos VENTA/PERDIDA/USO_INTERNO
6. ✅ **Reportes** de caja y stock bajo
7. ✅ **Auditoría** de quién hizo cada transacción
8. ✅ **Buscador global** por cliente/patente

**Estado:** ✅ CODE FREEZE - Listo para Frontend

---

**Documento generado por:** Product Owner & Arquitecto de Software Senior  
**Fecha:** 24 de enero de 2026  
**Versión:** 1.0 (Final)
