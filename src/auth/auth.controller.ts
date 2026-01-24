import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario y devuelve un token JWT válido por 8 horas.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso. Retorna access_token y datos del usuario.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          rut: '111111111',
          nombre: 'Administradora',
          role: 'ADMIN'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o usuario desactivado.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario',
    description: '⚠️ Solo ADMIN. Crea un nuevo usuario con rol ADMIN o WORKER.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente.',
    schema: {
      example: {
        message: 'Usuario creado exitosamente',
        user: {
          id: 'uuid',
          rut: '12345678-9',
          nombre: 'Juan Pérez',
          role: 'WORKER'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token JWT no proporcionado o inválido.' })
  @ApiResponse({ status: 403, description: 'Solo usuarios con rol ADMIN pueden crear usuarios.' })
  @ApiResponse({ status: 400, description: 'RUT ya existe o datos inválidos.' })
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
