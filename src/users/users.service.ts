import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}

  /**
   * Crea un nuevo usuario con contraseña hasheada
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Normalizar RUT (eliminar puntos y guiones, convertir a mayúsculas)
      const rutNormalizado = createUserDto.rut
        .replace(/\./g, '')
        .replace(/-/g, '')
        .toUpperCase();

      // Verificar si el RUT ya existe
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { rut: rutNormalizado }
      });

      if (existingUser) {
        throw new ConflictException(`El RUT ${createUserDto.rut} ya está registrado`);
      }

      // Hashear contraseña con bcrypt (10 rounds)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

      // Crear usuario
      const user = new User();
      user.rut = rutNormalizado;
      user.password = hashedPassword;
      user.nombre = createUserDto.nombre;
      user.role = createUserDto.role || UserRole.WORKER;
      user.isActive = true;

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      // Retornar usuario sin password
      const { password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword as User;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Busca un usuario por RUT (normalizado)
   */
  async findByRut(rut: string): Promise<User | null> {
    const rutNormalizado = rut
      .replace(/\./g, '')
      .replace(/-/g, '')
      .toUpperCase();

    return await this.dataSource.manager.findOne(User, {
      where: { rut: rutNormalizado }
    });
  }

  /**
   * Busca un usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.dataSource.manager.findOne(User, {
      where: { id }
    });
  }

  /**
   * Lista todos los usuarios (sin passwords)
   */
  async findAll(): Promise<User[]> {
    const users = await this.dataSource.manager.find(User, {
      order: { createdAt: 'DESC' }
    });

    // Retornar usuarios sin passwords
    return users.map(({ password, ...user }) => user as User);
  }

  /**
   * Desactiva un usuario (no lo elimina)
   */
  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = false;
    await this.dataSource.manager.save(user);
  }

  /**
   * Cambiar contraseña del usuario
   * Valida contraseña actual antes de cambiar
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Buscar usuario con contraseña
    const user = await this.dataSource.manager.findOne(User, {
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Guardar nueva contraseña
    user.password = hashedPassword;
    await this.dataSource.manager.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
