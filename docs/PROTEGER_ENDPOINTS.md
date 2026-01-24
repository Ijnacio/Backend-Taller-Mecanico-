# 🛡️ GUÍA RÁPIDA: Proteger Endpoints Existentes

Esta guía muestra cómo aplicar autenticación y autorización a los módulos ya implementados (Purchases, Counter-Sales, etc.).

---

## 📋 Estrategia de Protección

### Matriz de Permisos Recomendada

| Endpoint | ADMIN | WORKER | Público |
|----------|-------|--------|---------|
| **POST /auth/login** | ✅ | ✅ | ✅ |
| **POST /auth/register** | ✅ | ❌ | ❌ |
| **GET /users** | ✅ | ❌ | ❌ |
| **POST /purchases** | ✅ | ❌ | ❌ |
| **GET /purchases** | ✅ | ✅ | ❌ |
| **DELETE /purchases/:id** | ✅ | ❌ | ❌ |
| **POST /counter-sales** | ✅ | ✅ | ❌ |
| **GET /counter-sales** | ✅ | ✅ | ❌ |
| **POST /work-orders** | ✅ | ✅ | ❌ |
| **GET /work-orders** | ✅ | ✅ | ❌ |
| **POST /products** | ✅ | ❌ | ❌ |
| **GET /products** | ✅ | ✅ | ❌ |

---

## 🔧 Ejemplo 1: Proteger Purchases (solo lectura para WORKER)

**Archivo**: `src/purchases/purchases.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('purchases')
@UseGuards(JwtAuthGuard) // Aplica JWT a TODOS los endpoints del controller
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  // Solo ADMIN puede crear compras
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(createPurchaseDto);
  }

  // ADMIN y WORKER pueden listar
  @Get()
  findAll() {
    return this.purchasesService.findAll();
  }

  // Solo ADMIN puede eliminar
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.purchasesService.remove(id);
  }
}
```

---

## 🔧 Ejemplo 2: Counter-Sales (ambos roles pueden usar)

**Archivo**: `src/counter-sales/counter-sales.controller.ts`

```typescript
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CounterSalesService } from './counter-sales.service';
import { CreateCounterSaleDto } from './dto/create-counter-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('counter-sales')
@UseGuards(JwtAuthGuard) // Solo usuarios autenticados
export class CounterSalesController {
  constructor(private readonly counterSalesService: CounterSalesService) {}

  // Ambos roles pueden crear ventas
  @Post()
  create(
    @Body() createCounterSaleDto: CreateCounterSaleDto,
    @CurrentUser() user: any // Opcional: registrar quién hizo la venta
  ) {
    console.log(`Venta registrada por: ${user.nombre} (${user.role})`);
    return this.counterSalesService.create(createCounterSaleDto);
  }

  // Ambos roles pueden consultar
  @Get()
  findAll(@Query('tipo') tipo?: string) {
    return this.counterSalesService.findAll(tipo);
  }
}
```

---

## 🔧 Ejemplo 3: Products (ADMIN crea, WORKER solo lee)

**Archivo**: `src/products/products.controller.ts`

```typescript
import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards 
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Solo ADMIN crea productos
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // Ambos roles pueden listar
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Solo ADMIN puede editar
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  // Solo ADMIN puede eliminar
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
```

---

## 🎯 Patrón: Aplicar Guards Globalmente

Si quieres que **TODOS** los endpoints requieran autenticación por defecto:

**Archivo**: `src/main.ts`

```typescript
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aplicar JwtAuthGuard globalmente
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API Taller Frenos Aguilera')
    .setDescription('Backend completo con autenticación JWT')
    .setVersion('2.0')
    .addBearerAuth() // Agregar botón "Authorize" en Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

Si usas guards globales, debes **permitir explícitamente** endpoints públicos:

**Crear decorador público**:

**Archivo**: `src/auth/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Usarlo en login**:

```typescript
@Controller('auth')
export class AuthController {
  // Este endpoint NO requiere autenticación
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Este SÍ requiere autenticación (y rol ADMIN)
  @Post('register')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

---

## 📝 Documentar con Swagger

Agregar decoradores de Swagger para mejorar la documentación:

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Purchases') // Agrupa endpoints en Swagger
@Controller('purchases')
export class PurchasesController {
  
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Muestra candado en Swagger
  @ApiOperation({ summary: 'Crear nueva compra (Solo ADMIN)' })
  @ApiResponse({ status: 201, description: 'Compra creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos (requiere ADMIN)' })
  create(@Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(dto);
  }
}
```

---

## 🧪 Testing Rápido

### 1. Sin Token (debe fallar)

```bash
curl http://localhost:3000/purchases
# Respuesta esperada: 401 Unauthorized
```

### 2. Con Token WORKER intentando crear compra (debe fallar)

```bash
curl -X POST http://localhost:3000/purchases \
  -H "Authorization: Bearer <TOKEN_WORKER>" \
  -H "Content-Type: application/json" \
  -d '{"proveedor_id":1,"items":[...]}'
# Respuesta esperada: 403 Forbidden
```

### 3. Con Token ADMIN creando compra (debe funcionar)

```bash
curl -X POST http://localhost:3000/purchases \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"proveedor_id":1,"items":[...]}'
# Respuesta esperada: 201 Created
```

---

## ⚡ Atajos Rápidos

### Permitir Lectura a Todos, Escritura Solo ADMIN

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  
  // Cualquier usuario autenticado puede leer
  @Get()
  findAll() { /* ... */ }

  // Solo ADMIN puede escribir
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: any) { /* ... */ }
}
```

### Obtener Usuario Actual en Servicios

Si necesitas saber quién hizo la operación:

```typescript
@Post()
@UseGuards(JwtAuthGuard)
create(
  @Body() dto: CreatePurchaseDto,
  @CurrentUser() user: any
) {
  console.log(`Compra creada por: ${user.nombre}`);
  // Puedes agregar una columna "created_by_user_id" en la entidad
  return this.purchasesService.create(dto, user.userId);
}
```

---

## ✅ Checklist de Implementación

Para cada módulo que quieras proteger:

- [ ] Importar `JwtAuthGuard`, `RolesGuard`, `Roles`, `UserRole`
- [ ] Agregar `@UseGuards(JwtAuthGuard)` a nivel controller o método
- [ ] Agregar `@Roles(UserRole.ADMIN)` donde solo ADMIN pueda acceder
- [ ] (Opcional) Agregar `@ApiBearerAuth()` para Swagger
- [ ] Probar con token ADMIN, token WORKER y sin token
- [ ] Actualizar [AUTENTICACION.md](AUTENTICACION.md) con cambios

---

## 🎓 Conceptos Clave

1. **@UseGuards(JwtAuthGuard)**: Valida que el token sea válido
2. **@UseGuards(RolesGuard)**: Valida que el usuario tenga el rol correcto
3. **@Roles(UserRole.ADMIN)**: Define qué roles pueden acceder
4. **@CurrentUser()**: Obtiene datos del usuario del request
5. **Guards en cascade**: Primero JWT, luego Roles

---

## 🚀 Próximos Pasos

1. Aplicar guards a todos los controllers críticos
2. Probar exhaustivamente con ambos roles
3. Documentar endpoints en Swagger
4. Implementar rate limiting en login
5. Agregar logs de auditoría para acciones críticas

---

✅ **Con esta guía tienes todo listo para asegurar tu backend.**
