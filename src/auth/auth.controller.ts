import { Controller, Post, Body, UseGuards, Get, Req, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
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
Autentica al usuario con RUT y contraseña, devolviendo un token JWT válido.

**Formato de RUT:**
- Acepta con o sin puntos/guiones: "11.111.111-1" o "111111111"
- Se normaliza automáticamente antes de validar

**Token JWT:**
- Incluir en header: \`Authorization: Bearer <token>\`
- Expira en el tiempo configurado en .env (ej: 7d)
    `,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso. Retorna access_token y datos básicos del usuario.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          rut: '111111111',
          nombre: 'Administradora',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar nuevo usuario (Solo ADMIN)' })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        rut: user.rut,
        nombre: user.nombre,
        role: user.role,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario actual',
    description: 'Valida el token JWT y retorna los datos del usuario logueado. Esencial para mantener la sesión tras F5.'
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna los datos del usuario dueño del token.',
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  getProfile(@Request() req) {
    // req.user viene inyectado por el JwtAuthGuard/JwtStrategy
    return req.user;
  }
}
