# 🚗 API Backend - Taller Frenos Aguilera

> **Estado:** ✅ Producción Ready | **Versión:** 1.0.0 | **Stack:** NestJS 11 + TypeORM + PostgreSQL/SQLite

---
## Env
# ============================================
# 🚗 TALLER FRENOS AGUILERA - Variables de Entorno
# ============================================
# Copiar este archivo como .env y configurar los valores reales.
# NUNCA subir el archivo .env a git (ya está en .gitignore)

# ============================================
# 🌐 SERVIDOR
# ============================================
# Puerto donde correrá la aplicación NestJS
PORT=3000

# URL del frontend (para CORS). Usar 'true' para permitir todo en desarrollo.
FRONTEND_URL=http://localhost:5173

# Entorno de ejecución: development | production | test
NODE_ENV=development

# ============================================
# 🗄️ BASE DE DATOS
# ============================================
# Tipo de base de datos: sqlite | postgres | mysql
DB_TYPE=sqlite

# Ruta del archivo SQLite (solo para DB_TYPE=sqlite)
DB_DATABASE=./taller.db

# Configuración PostgreSQL (solo para DB_TYPE=postgres)
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=taller_frenos
# DB_USERNAME=postgres
# DB_PASSWORD=CHANGE_THIS_PASSWORD

# Sincronizar esquema automáticamente (SOLO en desarrollo, NUNCA en producción)
DB_SYNCHRONIZE=true

# ============================================
# 🔐 AUTENTICACIÓN JWT
# ============================================
# Secreto para firmar tokens JWT - CAMBIAR EN PRODUCCIÓN
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=CHANGE_THIS_SECRET_IN_PRODUCTION_USE_RANDOM_STRING

# Tiempo de expiración del token JWT
# Ejemplos: 8h (8 horas), 1d (1 día), 30m (30 minutos)
JWT_EXPIRES_IN=8h

# ============================================
# 📧 CONFIGURACIÓN ADICIONAL (FUTURO)
# ============================================
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=taller@example.com
# EMAIL_PASSWORD=app_password_here

# ============================================
# 🔍 LOGGING
# ============================================
# Nivel de logs: debug | info | warn | error
LOG_LEVEL=debug

# ============================================
# ⚠️ NOTAS DE SEGURIDAD PARA PRODUCCIÓN
# ============================================
# 1. Cambiar JWT_SECRET por un string aleatorio largo
# 2. Configurar DB_SYNCHRONIZE=false
# 3. Usar PostgreSQL en lugar de SQLite
# 4. Configurar FRONTEND_URL con el dominio real
# 5. Usar variables de entorno del proveedor cloud (no archivo .env)


## 🚀 Quick Start

`ash
# 1. Clonar e instalar
git clone https://github.com/Ijnacio/Backend-Taller-Mecanico-.git
cd Backend-Taller-Mecanico-
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Crear base de datos con usuarios de prueba
npm run seed

# 4. Iniciar servidor
npm run start:dev
`

| Recurso | URL |
|---------|-----|
| 🔌 API Base | `http://localhost:3000/api` |
| 📚 Swagger UI | `http://localhost:3000/docs` |

---

## 🔑 Credenciales de Prueba

| Rol | RUT | Contraseña |
|-----|-----|------------|
| **ADMIN** | `111111111` | `admin123` |
| **WORKER** | `999999999` | `taller123` |

---

## 📂 Documentación

| Documento | Descripción |
|-----------|-------------|
| [📖 Guía Completa API](docs/API_GUIDE.md) | Endpoints, DTOs y ejemplos de uso |
| [🔐 Autenticación](docs/AUTENTICACION.md) | Sistema JWT, roles y protección de rutas |
| [🧪 Testing](docs/TESTS.md) | Guía de ejecución de tests E2E |
| [💰 Módulo Ventas](docs/COUNTER_SALES_MODULE.md) | Ventas de mostrador y movimientos |
| [📋 Informe Técnico](docs/INFORME_TECNICO_FINAL.md) | Arquitectura y decisiones de diseño |
| [🔒 Proteger Endpoints](docs/PROTEGER_ENDPOINTS.md) | Guía de protección con JWT y roles |

---

## 🛠️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Desarrollo con hot-reload |
| `npm run start:prod` | Producción |
| `npm run seed` | Poblar base de datos |
| `npm run test` | Tests unitarios |
| `npm run test:e2e` | Tests End-to-End |
| `npm run lint` | Linter ESLint |
| `npm run build` | Compilar a JavaScript |

---

## 📍 Endpoints Principales

| Módulo | Endpoint Base | Descripción |
|--------|---------------|-------------|
| 🔐 Auth | `/api/auth` | Login y registro de usuarios |
| 👥 Users | `/api/users` | Gestión de usuarios |
| 📋 Work Orders | `/api/work-orders` | Órdenes de trabajo |
| 💰 Counter Sales | `/api/counter-sales` | Ventas de mostrador |
| 📦 Products | `/api/products` | Inventario de productos |
| 🏷️ Categories | `/api/categories` | Categorías de productos |
| 🚚 Providers | `/api/providers` | Proveedores |
| 🛒 Purchases | `/api/purchases` | Compras e ingreso de stock |
| 📊 Reports | `/api/reports` | Reportes y búsquedas |

> 📚 Ver documentación completa en Swagger: `http://localhost:3000/docs`

---

## 📞 Contacto

**Desarrollador:** Ignacio Sobarzo  
**Email:** ig.sobarzo@duocuc.cl  
**Repositorio:** [GitHub](https://github.com/Ijnacio/Backend-Taller-Mecanico-)

---

**© 2026 Taller Frenos Aguilera** ✅
