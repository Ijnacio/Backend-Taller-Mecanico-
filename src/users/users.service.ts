import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
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
        where: { rut: rutNormalizado },
      });

      if (existingUser) {
        throw new ConflictException(
          `El RUT ${createUserDto.rut} ya está registrado`,
        );
      }

      // Hashear contraseña con bcrypt (10 rounds)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      // Crear usuario
      const user = new User();
      user.rut = rutNormalizado;
      user.password = hashedPassword;
      user.nombre = createUserDto.nombre;
      user.role = createUserDto.role || UserRole.WORKER;
      user.isActive = true;
      // Por defecto, los usuarios creados por la web NO son soporte
      user.is_support = false; 

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      // Retornar usuario sin password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _p, ...userWithoutPassword } = savedUser;
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
      where: { rut: rutNormalizado },
    });
  }

  /**
   * Busca un usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.dataSource.manager.findOne(User, {
      where: { id },
    });
  }

  /**
   * Lista todos los usuarios (sin passwords)
   * 🔥 LÓGICA DE MODO FANTASMA AQUÍ
   */
  async findAll(currentUser: User): Promise<User[]> {
    let users: User[];

    // Si YO soy soporte, veo TODO (incluidos otros soportes)
    if (currentUser.is_support) {
      users = await this.dataSource.manager.find(User, {
        order: { createdAt: 'DESC' },
      });
    } else {
      // Si soy ADMIN normal (La Dueña), solo veo los que NO son soporte
      users = await this.dataSource.manager.find(User, {
        where: { is_support: false },
        order: { createdAt: 'DESC' },
      });
    }

    // Retornar usuarios sin passwords
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password: _p, ...user }) => user as User);
  }

  /**
   * Actualiza credenciales de un usuario (RUT y/o contraseña)
   * 🛡️ Protege cuentas de soporte contra edición por ADMIN normales
   */
  async update(
    id: string,
    updateData: { rut?: string; newPassword?: string },
    currentUser: User,
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 🛡️ ESCUDO: Un ADMIN normal no puede editar a un SOPORTE
    if (user.is_support && !currentUser.is_support) {
      throw new ForbiddenException(
        'No tienes permisos para editar una cuenta de Soporte Técnico.',
      );
    }

    // Cambiar RUT (normalizado a mayúsculas sin puntos/guiones)
    if (updateData.rut) {
      const rutNormalizado = updateData.rut
        .replace(/\./g, '')
        .replace(/-/g, '')
        .toUpperCase();
      user.rut = rutNormalizado;
    }

    // Cambiar contraseña (hasheada con bcrypt)
    if (updateData.newPassword) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(updateData.newPassword, saltRounds);
    }

    await this.dataSource.manager.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Desactiva un usuario (no lo elimina)
   * 🛡️ Protege cuentas de soporte contra desactivación por ADMIN normales
   */
  async deactivate(id: string, currentUser: User): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 🛡️ ESCUDO: Un ADMIN normal no puede desactivar a un SOPORTE
    if (user.is_support && !currentUser.is_support) {
      throw new ForbiddenException(
        'No tienes permisos para desactivar una cuenta de Soporte Técnico.',
      );
    }

    user.isActive = false;
    await this.dataSource.manager.save(user);
  }

  /**
   * Cambiar contraseña PROPIA
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.dataSource.manager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await this.dataSource.manager.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}