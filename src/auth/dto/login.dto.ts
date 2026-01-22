import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  rut: string;

  @IsString()
  @MinLength(6)
  password: string;
}
