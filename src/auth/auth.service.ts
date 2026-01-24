import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida credenciales y genera JWT
   */
  async login(loginDto: LoginDto) {
    const { rut, password } = loginDto;

    // Buscar usuario por RUT
    const user = await this.usersService.findByRut(rut);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Comparar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT
    const payload = {
      sub: user.id,
      rut: user.rut,
      role: user.role,
      nombre: user.nombre,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        rut: user.rut,
        nombre: user.nombre,
        role: user.role,
      },
    };
  }

  /**
   * Valida el JWT y retorna el usuario
   */
  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido');
    }

    return user;
  }
}
