# 🧪 PRUEBAS DE AUTENTICACIÓN

Este archivo contiene ejemplos de peticiones HTTP para probar el sistema de autenticación.

## 📋 Endpoints Disponibles

Base URL: `http://localhost:3000`

---

## 1️⃣ Login como ADMIN

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "rut": "11.111.111-1",
  "password": "admin123"
}
```

**Respuesta Esperada (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZjhlZTJhYi0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJydXQiOiIxMTExMTExMTEiLCJyb2xlIjoiQURNSU4iLCJub21icmUiOiJBZG1pbmlzdHJhZG9yIiwiaWF0IjoxNzM3NTIzOTg1LCJleHAiOjE3Mzc1NTI3ODV9.abc123...",
  "user": {
    "id": "5f8ee2ab-1234-5678-90ab-cdef12345678",
    "rut": "111111111",
    "nombre": "Administrador",
    "role": "ADMIN"
  }
}
```

💡 **Guarda el `access_token` para usarlo en las siguientes peticiones.**

---

## 2️⃣ Crear Usuario WORKER (requiere token ADMIN)

```http
POST http://localhost:3000/auth/register
Content-Type: application/json
Authorization: Bearer <PEGAR_TOKEN_AQUI>

{
  "rut": "22.333.444-5",
  "password": "mecanico123",
  "nombre": "Juan Pérez Mecánico",
  "role": "WORKER"
}
```

**Respuesta Esperada (201 Created)**:
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "uuid-generado",
    "rut": "223334445",
    "nombre": "Juan Pérez Mecánico",
    "role": "WORKER"
  }
}
```

---

## 3️⃣ Login como WORKER

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "rut": "22.333.444-5",
  "password": "mecanico123"
}
```

**Respuesta Esperada (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-worker",
    "rut": "223334445",
    "nombre": "Juan Pérez Mecánico",
    "role": "WORKER"
  }
}
```

---

## 4️⃣ Listar Usuarios (solo ADMIN)

```http
GET http://localhost:3000/users
Authorization: Bearer <TOKEN_ADMIN>
```

**Respuesta Esperada (200 OK)**:
```json
[
  {
    "id": "uuid-1",
    "rut": "111111111",
    "nombre": "Administrador",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-01-22T03:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "rut": "223334445",
    "nombre": "Juan Pérez Mecánico",
    "role": "WORKER",
    "isActive": true,
    "createdAt": "2026-01-22T03:15:00.000Z"
  }
]
```

---

## 5️⃣ Intentar Listar Usuarios como WORKER (debe fallar)

```http
GET http://localhost:3000/users
Authorization: Bearer <TOKEN_WORKER>
```

**Respuesta Esperada (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## 6️⃣ Desactivar Usuario (solo ADMIN)

```http
DELETE http://localhost:3000/users/<USER_ID>
Authorization: Bearer <TOKEN_ADMIN>
```

**Respuesta Esperada (200 OK)**:
```json
{
  "message": "Usuario desactivado"
}
```

---

## ❌ Casos de Error

### Error 401: Credenciales Inválidas

```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "rut": "11.111.111-1",
  "password": "contraseña_incorrecta"
}
```

**Respuesta**:
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

### Error 401: Token Inválido o Expirado

```http
GET http://localhost:3000/users
Authorization: Bearer token_invalido
```

**Respuesta**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Error 409: RUT Duplicado

```http
POST http://localhost:3000/auth/register
Content-Type: application/json
Authorization: Bearer <TOKEN_ADMIN>

{
  "rut": "11.111.111-1",
  "password": "otra123",
  "nombre": "Otro Usuario",
  "role": "WORKER"
}
```

**Respuesta**:
```json
{
  "statusCode": 409,
  "message": "El RUT 11.111.111-1 ya está registrado",
  "error": "Conflict"
}
```

---

## 🔐 Notas Importantes

1. **Normalización de RUT**: El sistema acepta RUT con o sin puntos y guiones:
   - `11.111.111-1` ✅
   - `11111111-1` ✅
   - `111111111` ✅
   Todos se normalizan a `111111111` internamente.

2. **Duración del Token**: 8 horas (jornada laboral completa)

3. **Headers Requeridos**:
   - `Content-Type: application/json` (en POST)
   - `Authorization: Bearer <token>` (en endpoints protegidos)

4. **Seguridad**:
   - Las contraseñas se almacenan hasheadas con bcrypt (10 rounds)
   - Los passwords nunca se retornan en las respuestas
   - Los usuarios desactivados no pueden hacer login

---

## 🛠️ Herramientas Recomendadas

### VS Code Extension: Thunder Client
1. Instalar extensión "Thunder Client"
2. Importar colección (crear archivo `thunder-collection.json`)
3. Usar variables de entorno para tokens

### Postman
1. Crear colección "Taller Frenos Aguilera Auth"
2. Agregar variable `{{baseUrl}}` = `http://localhost:3000`
3. Agregar variable `{{token}}` y configurar en Tests:
```javascript
pm.test("Token guardado", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.access_token);
});
```

### cURL desde terminal

**Login**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"11.111.111-1","password":"admin123"}'
```

**Listar usuarios** (reemplaza TOKEN):
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

## ✅ Checklist de Validación

- [ ] Login con usuario ADMIN funciona
- [ ] Token generado es válido (no da 401 en endpoints protegidos)
- [ ] ADMIN puede crear nuevos usuarios
- [ ] WORKER puede hacer login
- [ ] WORKER NO puede acceder a GET /users (403)
- [ ] WORKER NO puede crear usuarios (403)
- [ ] Credenciales inválidas retornan 401
- [ ] RUT duplicado retorna 409
- [ ] Token expira después de 8 horas

---

## 🚀 Próximos Pasos

Una vez validado el sistema de autenticación, puedes:

1. **Proteger endpoints existentes**:
   - Agregar `@UseGuards(JwtAuthGuard)` en controllers
   - Usar `@Roles(UserRole.ADMIN)` donde corresponda

2. **Integrar con Frontend**:
   - Almacenar token en localStorage o httpOnly cookie
   - Interceptor HTTP para agregar header Authorization
   - Redirección al login si 401

3. **Mejorar seguridad**:
   - Implementar refresh tokens
   - Rate limiting en /auth/login
   - 2FA para usuarios ADMIN
