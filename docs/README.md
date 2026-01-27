# 📚 Documentación Backend Taller Mecánico

> **Sistema de gestión para taller mecánico "Frenos Aguilera"**  
> **Stack:** NestJS 11 + TypeORM + PostgreSQL/SQLite  
> **Estado:** ✅ 100% Funcional en Producción

---

## 📋 Índice de Documentos

### Para Todo el Equipo
1. **[API_FRONTEND.md](API_FRONTEND.md)** ⭐ **IMPORTANTE**
   - Guía completa de endpoints para frontend
   - Ejemplos de request/response
   - Flujos de trabajo principales
   - Manejo de errores
   - **Úsalo primero si vas a consumir la API**

### Para Desarrolladores Backend
2. **[CODE_REVIEW.md](CODE_REVIEW.md)**
   - Arquitectura del proyecto
   - Patrones de diseño utilizados
   - Lógica de negocio por módulo
   - Sistema de seguridad (JWT + Guards)
   - Testing y cobertura

---

## 🚀 Quick Start

### URLs del Sistema
```
Producción:  http://[TU-IP]:3000
Swagger UI:  http://[TU-IP]:3000/docs
Desarrollo:  http://localhost:3000
```

### Usuarios de Prueba
| Rol | RUT | Contraseña | Acceso |
|-----|-----|------------|--------|
| **ADMIN** | 11.111.111-1 | admin123 | Acceso completo |
| **WORKER** | 99.999.999-9 | taller123 | Operaciones básicas |

---

## 🏗️ Arquitectura General

```
Frontend (React/Vue/Angular)
    ↓ HTTP REST
Backend API (NestJS) ← JWT Auth
    ↓ TypeORM
PostgreSQL/SQLite
```

### Módulos Implementados
- ✅ **Auth** - Login JWT con roles (ADMIN/WORKER)
- ✅ **Users** - Gestión de usuarios
- ✅ **Products** - Inventario con stock
- ✅ **Categories** - Organización de productos
- ✅ **Vehicle Models** - Compatibilidad de productos (marca/modelo/año)
- ✅ **Vehicles** - Vehículos de clientes con patente
- ✅ **Clients** - Base de datos de clientes
- ✅ **Providers** - Proveedores (solo ADMIN)
- ✅ **Purchases** - Compras a proveedores (solo ADMIN)
- ✅ **Work Orders** - Órdenes de trabajo con servicios
- ✅ **Counter Sales** - Ventas mostrador, pérdidas, uso interno
- ✅ **Reports** - Stock bajo, caja diaria, búsqueda global

---

## 📊 Endpoints Principales

### Públicos (sin auth)
```http
POST /auth/login                    # Login con RUT + contraseña
GET  /categories                    # Listar categorías
GET  /products                      # Listar productos
```

### Protegidos (requieren JWT)
```http
POST /auth/register                 # Crear usuario (ADMIN)
GET  /work-orders                   # Listar órdenes
POST /work-orders                   # Crear orden
GET  /counter-sales                 # Listar ventas mostrador
POST /counter-sales                 # Crear venta/pérdida
GET  /reports/low-stock             # Productos con stock bajo
GET  /reports/daily-cash            # Caja del día
GET  /reports/search?q=             # Búsqueda global
```

### Solo ADMIN
```http
GET  /providers                     # Listar proveedores
POST /purchases                     # Registrar compra
GET  /purchases                     # Ver historial compras
```

---

## 🔑 Conceptos Clave

### 1. VehicleModel vs Vehicle
- **VehicleModel:** Marca/Modelo/Año genérico (ej: Toyota Corolla 2020)
  - Usado para compatibilidad de productos
  - No tiene patente
- **Vehicle:** Vehículo real de un cliente con patente (ej: ABCD12)
  - Pertenece a un cliente
  - Tiene kilometraje

### 2. Tipos de Movimientos de Inventario
| Tipo | Descuenta Stock | Suma a Caja | Uso |
|------|-----------------|-------------|-----|
| **VENTA** | ✅ | ✅ | Cliente compra sin instalación |
| **PERDIDA** | ✅ | ❌ | Producto dañado/vencido |
| **USO_INTERNO** | ✅ | ❌ | Consumo del taller |

### 3. Flujo de Stock Automático
```
Compra → Stock SUBE
Orden de Trabajo → Stock BAJA (si usa producto)
Venta Mostrador → Stock BAJA
Pérdida → Stock BAJA (sin afectar caja)
```

### 4. Auditoría de Cuenta Compartida
Todos los WORKERS comparten RUT `99.999.999-9`, pero cada uno logea con su nombre:
```
Login: { rut: "99.999.999-9", password: "taller123" }
JWT: { nombre: "Carlos", role: "WORKER" }
WorkOrder: { createdByName: "Carlos", ... }
```

---

## 🧪 Testing

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- work-orders.service
npm test -- counter-sales.service

# E2E
npm run test:e2e

# Build
npm run build
```

**Estado actual:** ✅ 37/37 tests pasando

---

## 🌱 Seeds y Datos de Prueba

```bash
# Seed completo (desarrollo)
npm run seed

# Seed producción (solo usuarios ADMIN + WORKER)
npm run seed:prod
```

**Seed de desarrollo incluye:**
- 8 categorías (Frenos, Aceites, Filtros, etc.)
- 21 modelos de vehículos
- 20 productos con stock
- 4 proveedores
- 5 clientes
- 6 vehículos

---

## 📁 Estructura del Proyecto

```
src/
├── auth/                    # 🔐 JWT + Guards + Decorators
├── users/                   # 👤 Gestión usuarios
├── products/                # 📦 Inventario
├── categories/              # 🏷️ Categorías
├── vehicle-models/          # 🚗 Compatibilidad productos
├── vehicles/                # 🚙 Vehículos clientes
├── clients/                 # 👥 Base clientes
├── providers/               # 🏢 Proveedores (ADMIN)
├── purchases/               # 🛒 Compras (ADMIN)
├── work-orders/             # 📋 Órdenes trabajo
├── counter-sales/           # 💰 Ventas mostrador
└── reports/                 # 📊 Reportes
```

---

## 🔐 Seguridad

### JWT (JSON Web Token)
- **Expiración:** 8 horas (configurable en `.env`)
- **Secret:** Variable de entorno `JWT_SECRET`
- **Header:** `Authorization: Bearer [token]`

### Roles y Guards
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
```

### Passwords
- Hashing con **bcrypt** (10 rounds)
- Nunca se almacenan en texto plano
- Mínimo 6 caracteres

---

## 🛠️ Configuración (.env)

```bash
# Base de datos
DB_TYPE=postgres              # postgres | sqlite
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=taller_mecanico
DB_SYNCHRONIZE=false          # true solo en desarrollo

# JWT
JWT_SECRET=tu_secret_key_segura
JWT_EXPIRATION=8h
```

---

## 📞 Soporte

**¿Dudas sobre la API?** → Lee [API_FRONTEND.md](API_FRONTEND.md)  
**¿Dudas sobre el código?** → Lee [CODE_REVIEW.md](CODE_REVIEW.md)  
**¿Problemas técnicos?** → Revisa los logs de PM2 en producción

---

## 🎯 Checklist Frontend

- [ ] Implementar login y manejo de JWT
- [ ] Interceptor para renovar token/redirigir en 401
- [ ] CRUD productos con selector de modelos compatibles
- [ ] Formulario orden de trabajo (cliente + vehículo + items)
- [ ] Ventas mostrador con selector de tipo (VENTA/PERDIDA/USO_INTERNO)
- [ ] Dashboard con reportes (stock bajo, caja diaria)
- [ ] Buscador global (clientes, patentes, órdenes)
- [ ] Gestión proveedores y compras (solo para ADMIN)

---

**Última actualización:** 27 de enero de 2026  
**Versión Backend:** 1.0 Estable
