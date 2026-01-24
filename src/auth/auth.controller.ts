import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('🔐 Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión y obtener token JWT',
    description: `
Autentica al usuario con RUT y contraseña, devolviendo un token JWT válido por 8 horas.

**Formato de RUT:**
- Acepta con o sin puntos/guiones: "11.111.111-1" o "111111111"
- Se normaliza automáticamente antes de validar

**Token JWT:**
- Incluir en header: \`Authorization: Bearer <token>\`
- Expira en 8 horas (configurable en .env)
    ` 
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso. Retorna access_token para usar en peticiones autenticadas.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkIiwicnV0IjoiMTExMTExMTExIiwicm9sZSI6IkFETUlOIn0...',
        user: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          rut: '111111111',
          nombre: 'Administradora',
          role: 'ADMIN'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas o usuario desactivado',
    schema: {
      example: {
        statusCode: 401,
        message: 'Credenciales inválidas',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error de validación en los datos enviados',
    schema: {
      example: {
        statusCode: 400,
        message: ['rut should not be empty', 'password must be longer than or equal to 6 characters'],
        error: 'Bad Request'
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario (Solo ADMIN)',
    description: `
⚠️ **Requiere rol ADMIN**

Crea un nuevo usuario en el sistema con rol ADMIN o WORKER.

**Validaciones:**
- RUT debe ser único (no repetido)
- Contraseña mínimo 6 caracteres
- Rol por defecto: WORKER
    ` 
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        message: 'Usuario creado exitosamente',
        user: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          rut: '12345678-9',
          nombre: 'Juan Pérez',
          role: 'WORKER'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'RUT ya existe o datos inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: 'El RUT ya está registrado',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token JWT no proporcionado o inválido' })
  @ApiResponse({ 
    status: 403, 
    description: 'Usuario no tiene rol ADMIN - Acceso denegado',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden'
      }
    }
  })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        rut: user.rut,
        nombre: user.nombre,
        role: user.role
      }
    };
  }
}
