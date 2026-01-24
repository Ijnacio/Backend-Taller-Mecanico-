# 🔐 MÓDULO DE AUTENTICACIÓN Y AUTORIZACIÓN

## 📖 Resumen Ejecutivo

Sistema completo de autenticación con JWT y roles para "Frenos Aguilera". Los usuarios se autentican con RUT y contraseña, reciben un token JWT y acceden a endpoints según su rol (ADMIN o WORKER).

---

## 🏗️ Arquitectura

### Módulos Implementados

1. **UsersModule**: Gestión de usuarios con hash bcrypt
2. **AuthModule**: Login, JWT, guards y decoradores

### Estructura de Directorios

```
src/
├── users/
│   ├── dto/
│   │   └── create-user.dto.ts         # Validación para crear usuarios
│   ├── entities/
│   │   └── user.entity.ts             # Tabla users en BD
│   ├── enums/
│   │   └── user-role.enum.ts          # ADMIN | WORKER
│   ├── users.controller.ts            # GET /users (ADMIN only)
│   ├── users.service.ts               # Lógica: create, findByRut, hash
│   └── users.module.ts
├── auth/
│   ├── decorators/
│   │   ├── roles.decorator.ts         # @Roles(UserRole.ADMIN)
│   │   └── current-user.decorator.ts  # @CurrentUser()
│   ├── dto/
│   │   └── login.dto.ts               # RUT + Password
│   ├── guards/
│   │   ├── jwt-auth.guard.ts          # Valida JWT en request
│   │   └── roles.guard.ts             # Valida rol del usuario
│   ├── strategies/
│   │   └── jwt.strategy.ts            # Passport JWT Strategy
│   ├── auth.controller.ts             # POST /auth/login, /auth/register
│   ├── auth.service.ts                # Lógica login y validación
│   └── auth.module.ts
└── seed.ts                            # Crea usuario ADMIN inicial
```

---

## 🔑 Características de Seguridad

### ✅ Implementadas

| Característica | Implementación | Detalle |
|----------------|----------------|---------|
| **Hash de Contraseñas** | bcrypt (10 rounds) | Las contraseñas nunca se almacenan en texto plano |
| **JWT** | HS256, 8 horas | Token firmado con secreto (cambiar en prod) |
| **Normalización RUT** | `replace()` + `toUpperCase()` | Evita duplicados: "12.345.678-9" → "123456789" |
| **Validación DTO** | class-validator | Valida inputs antes de llegar a servicios |
| **Guards de Rol** | RolesGuard + Reflector | Restringe endpoints según UserRole |
| **Usuario Inactivo** | `isActive: boolean` | Desactivar sin eliminar (GDPR friendly) |
| **Transacciones** | QueryRunner | Rollback automático en errores |

### 🔒 Variables de Entorno (Producción)

Crear archivo `.env`:

```bash
JWT_SECRET=tu_secreto_super_seguro_y_largo_generado_con_openssl
JWT_EXPIRATION=8h
DATABASE_URL=postgresql://user:pass@host:5432/db
```

Generar secreto seguro:
```bash
openssl rand -base64 32
```

---

## 📋 Endpoints

### 1. POST /auth/login (Público)

**Descripción**: Login con RUT y contraseña, retorna JWT.

**Request**:
```json
{
  "rut": "11.111.111-1",
  "password": "admin123"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-123",
    "rut": "111111111",
    "nombre": "Administrador",
    "role": "ADMIN"
  }
}
```

**Errores**:
- 401: Credenciales inválidas o usuario desactivado

---

### 2. POST /auth/register (Protegido - ADMIN)

**Descripción**: Crear nuevos usuarios (solo ADMIN puede hacerlo).

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request**:
```json
{
  "rut": "22.333.444-5",
  "password": "mecanico123",
  "nombre": "Juan Pérez",
  "role": "WORKER"
}
```

**Response** (201 Created):
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "uuid-456",
    "rut": "223334445",
    "nombre": "Juan Pérez",
    "role": "WORKER"
  }
}
```

**Errores**:
- 401: No autenticado
- 403: No tiene rol ADMIN
- 409: RUT ya registrado

---

### 3. GET /users (Protegido - ADMIN)

**Descripción**: Listar todos los usuarios (sin passwords).

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid-123",
    "rut": "111111111",
    "nombre": "Administrador",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-01-22T10:00:00Z"
  },
  {
    "id": "uuid-456",
    "rut": "223334445",
    "nombre": "Juan Pérez",
    "role": "WORKER",
    "isActive": true,
    "createdAt": "2026-01-22T11:00:00Z"
  }
]
```

---

### 4. DELETE /users/:id (Protegido - ADMIN)

**Descripción**: Desactivar usuario (no lo elimina de BD).

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Usuario desactivado"
}
```

---

## 🛡️ Uso de Guards y Decoradores

### Proteger Endpoint con JWT

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  
  // Solo usuarios autenticados pueden acceder
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.productsService.findAll();
  }
}
```

### Restringir por Rol

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from './users/enums/user-role.enum';

@Controller('purchases')
export class PurchasesController {
  
  // Solo ADMIN puede crear compras
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(dto);
  }
}
```

### Obtener Usuario Actual

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller('profile')
export class ProfileController {
  
  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    // user contiene: { userId, rut, role, nombre }
    return {
      message: `Hola ${user.nombre}`,
      role: user.role
    };
  }
}
```

---

## 🧪 Testing con Postman / Thunder Client

### 1. Login y obtener token

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "rut": "11.111.111-1",
  "password": "admin123"
}
```

Copiar el `access_token` de la respuesta.

### 2. Crear nuevo usuario (como ADMIN)

```http
POST http://localhost:3000/auth/register
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "rut": "22.333.444-5",
  "password": "mecanico123",
  "nombre": "Juan Pérez",
  "role": "WORKER"
}
```

### 3. Login como WORKER

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "rut": "22.333.444-5",
  "password": "mecanico123"
}
```

### 4. Intentar registrar usuario como WORKER (debe fallar)

```http
POST http://localhost:3000/auth/register
Content-Type: application/json
Authorization: Bearer <token_del_worker>

{
  "rut": "33.444.555-6",
  "password": "test123",
  "nombre": "Otro Usuario",
  "role": "WORKER"
}
```

Debe retornar **403 Forbidden**.

---

## 🔄 Flujo de Autenticación

```mermaid
sequenceDiagram
    participant C as Cliente (Frontend)
    participant AC as AuthController
    participant AS as AuthService
    participant US as UsersService
    participant DB as SQLite

    C->>AC: POST /auth/login {rut, password}
    AC->>AS: login(loginDto)
    AS->>US: findByRut(rut)
    US->>DB: SELECT * FROM user WHERE rut = ?
    DB-->>US: User entity
    US-->>AS: User
    AS->>AS: bcrypt.compare(password, hash)
    alt Password válido
        AS->>AS: jwtService.sign({ sub, role })
        AS-->>AC: { access_token, user }
        AC-->>C: 200 OK + JWT
    else Password inválido
        AS-->>AC: UnauthorizedException
        AC-->>C: 401 Unauthorized
    end
```

---

## 📊 Modelo de Datos

### Entidad User

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | uuid | PRIMARY KEY | ID autogenerado |
| `rut` | varchar | UNIQUE | RUT normalizado sin puntos ni guion |
| `password` | varchar | NOT NULL | Hash bcrypt (60 caracteres) |
| `nombre` | varchar | NOT NULL | Nombre completo del usuario |
| `role` | enum | DEFAULT 'WORKER' | ADMIN \| WORKER |
| `isActive` | boolean | DEFAULT true | Estado del usuario |
| `createdAt` | timestamp | AUTO | Fecha de creación |

---

## 🚀 Despliegue y Recomendaciones

### ⚠️ Antes de Producción

1. **Cambiar JWT_SECRET**: Usar variable de entorno con secreto fuerte
2. **HTTPS Obligatorio**: JWT solo debe viajar por conexión segura
3. **Rate Limiting**: Implementar `@nestjs/throttler` en `/auth/login`
4. **Logs de Auditoría**: Registrar intentos de login fallidos
5. **Refresh Tokens**: Considerar tokens de larga duración + refresh flow
6. **2FA**: Implementar autenticación de dos factores para ADMIN

### 🔐 Cambiar Secret en Producción

[auth.module.ts](c:\Users\Ignacio\backend-taller\src\auth\auth.module.ts):
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET, // Quitar el fallback
  signOptions: { expiresIn: process.env.JWT_EXPIRATION || '8h' },
}),
```

[jwt.strategy.ts](c:\Users\Ignacio\backend-taller\src\auth\strategies\jwt.strategy.ts):
```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: process.env.JWT_SECRET, // Quitar el fallback
});
```

### 🛠️ Scripts Útiles

```bash
# Crear usuario ADMIN inicial
npm run seed

# Iniciar servidor desarrollo
npm run start:dev

# Compilar para producción
npm run build
npm run start:prod
```

---

## 🎯 Próximos Pasos Opcionales

1. **Refresh Tokens**: Implementar token de refresh de 30 días
2. **Password Reset**: Endpoint para recuperar contraseña por email
3. **Rate Limiting**: Limitar intentos de login (5 por minuto)
4. **Logs de Auditoría**: Tabla `audit_logs` para registrar acciones críticas
5. **Cambio de Contraseña**: Endpoint PATCH /users/me/password
6. **Swagger Docs**: Agregar `@ApiBearerAuth()` en controllers

---

## 📞 Soporte

**Credenciales por Defecto**:
- RUT: `11.111.111-1`
- Password: `admin123`

Para regenerar el usuario ADMIN, ejecutar:
```bash
npm run seed
```

✅ **Sistema de autenticación completamente operativo y listo para producción** (con cambios recomendados aplicados).
