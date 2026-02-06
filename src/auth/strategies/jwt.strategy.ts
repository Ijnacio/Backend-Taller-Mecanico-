import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') 
        'SECRET_KEY_SUPER_SEGURA_CAMBIAR_EN_PRODUCCION',
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.findById(payload.sub);

    if (!user 
 !user.isActive) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    // Esto se adjuntará al request.user
    return {
      userId: user.id,
      rut: user.rut,
      role: user.role,
      nombre: user.nombre,
      is_support: user.is_support || false,
    };
  }
}