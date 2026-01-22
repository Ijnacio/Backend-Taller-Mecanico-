# 📦 MÓDULO: COUNTER-SALES (Ventas de Mostrador y Movimientos de Inventario)

**Fecha:** 22 Enero 2026  
**Propósito:** Cerrar el ciclo completo de inventario manejando salidas de stock sin órdenes de trabajo.

---

## 🎯 PROBLEMA RESUELTO

**Antes:** Solo podíamos descontar stock mediante Órdenes de Trabajo (con vehículo).

**Ahora:** Cubrimos 3 casos adicionales:
1. **VENTA:** Cliente compra repuesto sin instalación (venta de mostrador)
2. **PERDIDA:** Producto dañado, roto o vencido
3. **USO_INTERNO:** Consumo del taller para uso propio

---

## 📁 ARCHIVOS CREADOS

```
src/counter-sales/
├── enums/
│   └── movement-type.enum.ts       (Enum: VENTA | PERDIDA | USO_INTERNO)
├── dto/
│   └── create-counter-sale.dto.ts  (Validaciones y estructura de entrada)
├── entities/
│   ├── counter-sale.entity.ts      (Cabecera del movimiento)
│   └── counter-sale-detail.entity.ts (Detalles por producto)
├── counter-sales.service.ts        (Lógica de negocio transaccional)
├── counter-sales.controller.ts     (Endpoint REST)
└── counter-sales.module.ts         (Configuración NestJS)
```

**Registrado en:** `app.module.ts`

---

## 🔄 LÓGICA DE NEGOCIO

### **Flujo General:**
```
1. Validar tipo de movimiento
2. Validar items (SKU, cantidad, precio si es venta)
3. Por cada producto:
   ├─ Buscar en inventario
   ├─ Validar stock disponible
   ├─ Restar stock
   └─ Registrar detalle
4. Calcular totales según tipo:
   ├─ VENTA → Sumar ingresos
   ├─ PERDIDA → Registrar costo perdido
   └─ USO_INTERNO → Sin monto
5. Guardar movimiento completo
```

### **Validaciones Específicas:**

| Tipo | Validación | Campo Requerido |
|------|-----------|----------------|
| VENTA | `comprador` obligatorio | Nombre del cliente |
| VENTA | `precio_venta > 0` | Precio por item |
| PERDIDA | `comentario` recomendado | Razón de la pérdida |
| USO_INTERNO | - | - |

---

## 📡 ENDPOINT

### **POST /counter-sales**

**Headers:**
```
Content-Type: application/json
```

---

## 📋 EJEMPLOS DE USO

### **1. VENTA DE MOSTRADOR**

Cliente compra 2 pastillas sin instalación.

**Request:**
```json
POST http://localhost:3000/counter-sales
Content-Type: application/json

{
  "tipo_movimiento": "VENTA",
  "comprador": "Juan López (Vecino)",
  "comentario": "Venta de mostrador, cliente no requiere instalación",
  "items": [
    {
      "sku": "A-204",
      "cantidad": 2,
      "precio_venta": 8000
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Movimiento registrado exitosamente",
  "id": "uuid-sale-123",
  "tipo": "VENTA",
  "total_venta": 16000,
  "costo_perdida": 0,
  "items_procesados": 1
}
```

**Efecto en BD:**
- ✅ Stock de "A-204" disminuye de 10 → 8
- ✅ Se registra ingreso de $16.000
- ✅ Comprador: "Juan López (Vecino)"

---

### **2. PÉRDIDA DE PRODUCTO**

Se rompió un disco al abrirlo.

**Request:**
```json
POST http://localhost:3000/counter-sales
Content-Type: application/json

{
  "tipo_movimiento": "PERDIDA",
  "comentario": "Disco ventilado llegó dañado de fábrica",
  "items": [
    {
      "sku": "D-550",
      "cantidad": 1
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Movimiento registrado exitosamente",
  "id": "uuid-loss-456",
  "tipo": "PERDIDA",
  "total_venta": 0,
  "costo_perdida": 25000,
  "items_procesados": 1
}
```

**Efecto en BD:**
- ✅ Stock de "D-550" disminuye de 4 → 3
- ✅ Se registra pérdida de $25.000 (costo del producto)
- ✅ NO genera ingreso

---

### **3. USO INTERNO**

Taller usa sus propios repuestos.

**Request:**
```json
POST http://localhost:3000/counter-sales
Content-Type: application/json

{
  "tipo_movimiento": "USO_INTERNO",
  "comentario": "Cambio de pastillas en camioneta del taller",
  "items": [
    {
      "sku": "A-204",
      "cantidad": 1
    },
    {
      "sku": "L-120",
      "cantidad": 1
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Movimiento registrado exitosamente",
  "id": "uuid-internal-789",
  "tipo": "USO_INTERNO",
  "total_venta": 0,
  "costo_perdida": 0,
  "items_procesados": 2
}
```

**Efecto en BD:**
- ✅ Stock de "A-204" disminuye
- ✅ Stock de "L-120" disminuye
- ✅ Sin monto (no es venta ni pérdida)

---

### **4. VENTA MÚLTIPLE**

Cliente compra varios productos juntos.

**Request:**
```json
POST http://localhost:3000/counter-sales

{
  "tipo_movimiento": "VENTA",
  "comprador": "Taller El Vecino",
  "comentario": "Venta al por mayor a otro taller",
  "items": [
    {
      "sku": "A-204",
      "cantidad": 5,
      "precio_venta": 7500
    },
    {
      "sku": "D-550",
      "cantidad": 2,
      "precio_venta": 24000
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Movimiento registrado exitosamente",
  "id": "uuid-sale-999",
  "tipo": "VENTA",
  "total_venta": 85500,
  "costo_perdida": 0,
  "items_procesados": 2
}
```

**Cálculo:**
- 5 × $7.500 = $37.500
- 2 × $24.000 = $48.000
- **Total:** $85.500

---

## ⚠️ MANEJO DE ERRORES

### **Error 1: Stock Insuficiente**
```json
POST /counter-sales
{
  "tipo_movimiento": "VENTA",
  "comprador": "Cliente",
  "items": [
    { "sku": "A-204", "cantidad": 100, "precio_venta": 8000 }
  ]
}

// Response (400):
{
  "statusCode": 400,
  "message": "Stock insuficiente para Pastilla Delantera. Disponible: 10, Solicitado: 100"
}
```

### **Error 2: Venta Sin Comprador**
```json
POST /counter-sales
{
  "tipo_movimiento": "VENTA",
  "items": [
    { "sku": "A-204", "cantidad": 1, "precio_venta": 8000 }
  ]
}

// Response (400):
{
  "statusCode": 400,
  "message": "Las ventas requieren el nombre del comprador"
}
```

### **Error 3: Venta Sin Precio**
```json
POST /counter-sales
{
  "tipo_movimiento": "VENTA",
  "comprador": "Cliente",
  "items": [
    { "sku": "A-204", "cantidad": 1 }  // ❌ Falta precio_venta
  ]
}

// Response (400):
{
  "statusCode": 400,
  "message": "El producto Pastilla Delantera requiere un precio de venta válido"
}
```

### **Error 4: Producto No Existe**
```json
POST /counter-sales
{
  "tipo_movimiento": "PERDIDA",
  "items": [
    { "sku": "X-999", "cantidad": 1 }
  ]
}

// Response (400):
{
  "statusCode": 400,
  "message": "El producto con SKU X-999 no existe en inventario."
}
```

---

## 📊 LISTAR MOVIMIENTOS

### **GET /counter-sales**

Lista todos los movimientos de inventario.

**Response:**
```json
[
  {
    "id": "uuid-1",
    "tipo_movimiento": "VENTA",
    "fecha": "2026-01-22T10:30:00.000Z",
    "total_venta": 16000,
    "costo_perdida": 0,
    "comprador": "Juan López",
    "comentario": "Venta de mostrador",
    "detalles": [
      {
        "cantidad": 2,
        "precio_venta_unitario": 8000,
        "total_fila": 16000,
        "producto": {
          "sku": "A-204",
          "nombre": "Pastilla Delantera"
        }
      }
    ]
  },
  {
    "id": "uuid-2",
    "tipo_movimiento": "PERDIDA",
    "fecha": "2026-01-22T11:00:00.000Z",
    "total_venta": 0,
    "costo_perdida": 25000,
    "comentario": "Disco dañado de fábrica",
    "detalles": [...]
  }
]
```

---

### **GET /counter-sales?tipo=VENTA**

Filtra solo las ventas.

**Query Parameters:**
- `tipo`: `VENTA` | `PERDIDA` | `USO_INTERNO`

---

## 🔒 INTEGRIDAD DE DATOS

### **Relaciones Protegidas:**

```typescript
// counter-sale-detail.entity.ts
@ManyToOne(() => Product, { onDelete: 'RESTRICT' })
producto: Product;
```

- ✅ No se puede borrar un producto usado en movimientos
- ✅ Historial completo preservado
- ✅ Auditoría posible

### **Transacciones Atómicas:**

- ✅ Todo o nada (rollback automático si falla)
- ✅ Stock nunca queda inconsistente
- ✅ Múltiples items procesados en una sola transacción

---

## 📈 CASOS DE USO CUBIERTOS

| Escenario | Módulo Usado | Stock | Monto |
|-----------|--------------|-------|-------|
| Cambio de pastillas con servicio | WorkOrders | ⬇️ Resta | 💰 Ingreso |
| Venta sin instalación | CounterSales (VENTA) | ⬇️ Resta | 💰 Ingreso |
| Compra a proveedor | Purchases | ⬆️ Suma | - |
| Producto dañado | CounterSales (PERDIDA) | ⬇️ Resta | 📉 Pérdida |
| Uso del taller | CounterSales (USO_INTERNO) | ⬇️ Resta | - |

---

## ✅ CHECKLIST

- [x] Entity y Detail creadas
- [x] DTO con validaciones
- [x] Service transaccional
- [x] Controller con endpoints
- [x] Módulo registrado en app.module
- [x] Enum de tipos de movimiento
- [x] Protección de historial (RESTRICT)
- [x] Sin errores de TypeScript
- [x] Ejemplos de uso documentados

---

## 🚀 PRÓXIMOS PASOS

**Para Frontend:**
1. Consumir `GET /counter-sales?tipo=VENTA` para reporte de ventas diarias
2. Formulario simple para registrar ventas rápidas
3. Botón "Registrar Pérdida" en vista de inventario
4. Dashboard con totales de ventas vs pérdidas

**Opcional (Mejoras):**
- [ ] Reporte de ventas por rango de fechas
- [ ] Exportar a Excel
- [ ] Gráfico de pérdidas por mes
- [ ] Alertas de pérdidas recurrentes

---

**FIN DE DOCUMENTACIÓN**
