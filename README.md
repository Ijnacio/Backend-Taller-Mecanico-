# 🚗 API Backend - Taller Frenos Aguilera

> **Estado:** ✅ Producción Ready | **Versión:** 1.0.0 | **Stack:** NestJS 11 + TypeORM + PostgreSQL/SQLite

---

## ⚙️ Variables de Entorno

Copiar `.env.example` como `.env` y configurar:

```bash
# ============================================
# 🚗 TALLER FRENOS AGUILERA - Variables de Entorno
# ============================================

# 🌐 SERVIDOR
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# 🗄️ BASE DE DATOS (SQLite para desarrollo)
DB_TYPE=sqlite
DB_DATABASE=./taller.db
DB_SYNCHRONIZE=true

# 🗄️ BASE DE DATOS (PostgreSQL para producción)
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=taller_frenos
# DB_USERNAME=postgres
# DB_PASSWORD=CHANGE_THIS_PASSWORD
# DB_SYNCHRONIZE=false

# 🔐 AUTENTICACIÓN JWT
JWT_SECRET=CHANGE_THIS_SECRET_IN_PRODUCTION_USE_RANDOM_STRING
JWT_EXPIRES_IN=8h

# 🔍 LOGGING
LOG_LEVEL=debug
```

> ⚠️ **Producción:** Cambiar `JWT_SECRET`, usar PostgreSQL, y `DB_SYNCHRONIZE=false`

---

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
| [� Code Review](docs/CODE_REVIEW.md) | Arquitectura, patrones, lógica de negocio y tests |
| [👨‍🎨 Frontend Guide](docs/FRONTEND_GUIDE.md) | DTOs, endpoints, mockups para el equipo Frontend |
| [👩‍💼 README Ejecutivo](docs/README_EJECUTIVO.md) | Resumen no-técnico para gerencia |
| [🆕 Start Here](docs/START_HERE.md) | Guía de inicio para nuevos desarrolladores |
| [🔐 Auditoría](docs/AUDIT_EXECUTIVE_SUMMARY.md) | Sistema de auditoría y trazabilidad |

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
