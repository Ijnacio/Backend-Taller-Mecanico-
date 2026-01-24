# 📖 Guía Completa de la API - Taller Frenos Aguilera

> Documentación detallada de endpoints, DTOs, ejemplos de integración y manejo de errores.

---

## 📋 Tabla de Contenidos

1. [Mapa de Endpoints](#-mapa-de-endpoints)
2. [Configuración del Frontend (Axios)](#-configuración-del-frontend-axios)
3. [Diccionario de Datos JSON](#-diccionario-de-datos-json)
4. [Mapa de Errores HTTP](#-mapa-de-errores-http)
5. [Flujo de Autenticación](#-flujo-de-autenticación)
6. [Catálogo de Servicios](#-catálogo-de-servicios)

---

## 📍 Mapa de Endpoints

### 🔐 Autenticación
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | Login (devuelve JWT) |
| `POST` | `/api/auth/register` | ✅ ADMIN | Crear usuario |
| `PATCH` | `/api/users/change-password` | ✅ | Cambiar contraseña propia |

### 📋 Operación Diaria
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/api/work-orders` | ✅ | Crear orden de trabajo |
| `GET` | `/api/work-orders` | ✅ | Listar órdenes |
| `GET` | `/api/work-orders/services-catalog` | ✅ | Catálogo de servicios |
| `POST` | `/api/counter-sales` | ✅ | Venta mesón / Pérdida / Uso interno |
| `GET` | `/api/counter-sales` | ✅ | Listar movimientos |

### 📦 Inventario
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/api/products` | ✅ | Listar productos |
| `POST` | `/api/products` | ✅ | Crear producto |
| `PATCH` | `/api/products/:id` | ✅ | Actualizar producto |
| `POST` | `/api/purchases` | ✅ | Registrar compra (+stock) |

### 📊 Reportes
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/api/reports/low-stock` | ✅ | Productos con stock bajo |
| `GET` | `/api/reports/daily-cash` | ✅ | Caja del día |
| `GET` | `/api/reports/daily-cash?fecha=2026-01-22` | ✅ | Caja de fecha específica |
| `GET` | `/api/reports/search?q=texto` | ✅ | Buscador global |

---

## ⚙️ Configuración del Frontend (Axios)

### Archivo: `src/services/api.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Inyectar Token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Sesión expirada'));
    }
    
    if (status === 403) {
      alert('No tienes permisos para esta acción');
      return Promise.reject(new Error('Sin permisos'));
    }
    
    if (status === 400) {
      const mensaje = error.response?.data?.message || 'Error de validación';
      alert(mensaje);
      return Promise.reject(new Error(mensaje));
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### Archivo: `src/services/auth.service.js`

```javascript
import api from './api';

export const authService = {
  async login(rut, password) {
    const { data } = await api.post('/auth/login', { rut, password });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }
};
```

---

## 📖 Diccionario de Datos JSON

### 1️⃣ LOGIN

**Request:**
```json
POST /api/auth/login
{
  "rut": "11.111.111-1",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "rut": "111111111",
    "nombre": "Administradora",
    "role": "ADMIN"
  }
}
```

---

### 2️⃣ CREAR ORDEN DE TRABAJO

**Request:**
```json
POST /api/work-orders
Authorization: Bearer <token>

{
  "numero_orden_papel": 1547,
  "realizado_por": "Carlos González",
  "revisado_por": "Pedro Supervisor",
  
  "cliente": {
    "rut": "12.345.678-9",
    "nombre": "María Fernanda López",
    "email": "maria.lopez@gmail.com",
    "telefono": "+56912345678"
  },
  
  "vehiculo": {
    "patente": "ABCD12",
    "marca": "Toyota",
    "modelo": "Yaris Sport",
    "kilometraje": 87500
  },
  
  "items": [
    {
      "servicio_nombre": "Cambio Pastillas",
      "descripcion": "Cambio pastillas delanteras",
      "precio": 45000,
      "product_sku": "F-001",
      "cantidad_producto": 1
    },
    {
      "servicio_nombre": "Revisión Sistema Completo",
      "descripcion": "Revisión de frenos y ABS",
      "precio": 15000
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Orden de trabajo creada exitosamente",
  "id": "uuid-orden",
  "numero_orden_papel": 1547,
  "total_cobrado": 60000,
  "cliente": "María Fernanda López",
  "vehiculo": "ABCD12",
  "items_procesados": 2
}
```

---

### 3️⃣ VENTA DE MOSTRADOR

**Request:**
```json
POST /api/counter-sales
Authorization: Bearer <token>

{
  "tipo_movimiento": "VENTA",
  "comprador": "Juan Pérez",
  "comentario": "Cliente compró sin instalación",
  "items": [
    { "sku": "F-001", "cantidad": 2, "precio_venta": 28000 }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Movimiento registrado exitosamente",
  "id": "uuid",
  "tipo": "VENTA",
  "total_venta": 56000,
  "costo_perdida": 0,
  "items_procesados": 1
}
```

---

### 4️⃣ REGISTRAR PÉRDIDA

```json
{
  "tipo_movimiento": "PERDIDA",
  "comentario": "Producto dañado en almacén",
  "items": [
    { "sku": "F-002", "cantidad": 1 }
  ]
}
```

---

### 5️⃣ USO INTERNO

```json
{
  "tipo_movimiento": "USO_INTERNO",
  "comentario": "Aceite para mantención del taller",
  "items": [
    { "sku": "L-001", "cantidad": 1 }
  ]
}
```

---

## ⚠️ Mapa de Errores HTTP

### Errores de Autenticación

| Código | Cuándo | Acción Frontend |
|--------|--------|-----------------|
| `401` | Token expirado/inválido | Redirigir a `/login` |
| `401` | Credenciales incorrectas | Mostrar error en form |
| `403` | Sin permisos (rol) | Mostrar alerta |

### Errores de Validación (400)

| Situación | Message |
|-----------|---------|
| Stock insuficiente | `"Stock insuficiente para {producto}. Quedan {n}."` |
| Producto no existe | `"El producto con SKU {sku} no existe."` |
| Campo requerido faltante | `"{campo} should not be empty"` |
| Venta sin comprador | `"Las ventas requieren el nombre del comprador"` |
| Venta sin precio | `"El producto {nombre} requiere un precio de venta válido"` |

---

## 🔄 Flujo de Autenticación

```
Usuario → POST /api/auth/login → Token JWT
       ↓
Guardar en localStorage
       ↓
Peticiones con: Authorization: Bearer {token}
       ↓
   401? → Limpiar localStorage → Redirigir /login
```

---

## 📊 Catálogo de Servicios

`GET /api/work-orders/services-catalog` retorna:

```json
[
  "Cambio Pastillas",
  "Cambio Discos",
  "Rectificado",
  "Cambio Líquido Frenos",
  "Revisión Sistema Completo",
  "Cambio Zapatas Traseras",
  "Purga Sistema Frenos",
  "Revisión ABS",
  "Otros"
]
```

---

## ✅ Checklist de Integración

- [ ] Configurar `api.js` con interceptors
- [ ] Implementar pantalla de Login
- [ ] Guardar token en localStorage
- [ ] Probar crear orden de trabajo
- [ ] Verificar que descuenta stock
- [ ] Probar reporte de caja diaria
