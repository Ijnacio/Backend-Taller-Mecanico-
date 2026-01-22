import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  rut: string; // Será normalizado en el servicio

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  nombre: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole; // Por defecto será WORKER
}
