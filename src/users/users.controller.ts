import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './enums/user-role.enum';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users
   * Solo ADMIN puede listar usuarios.
   * El Service decidirá si mostrar u ocultar los usuarios de soporte.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser() user: User) {
    return this.usersService.findAll(user);
  }

  /**
   * PATCH /users/change-password
   * Cualquier usuario autenticado puede cambiar su PROPIA contraseña.
   */
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: { userId: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.userId, changePasswordDto);
  }

  /**
   * PATCH /users/:id
   * Admin puede cambiar RUT o Password de otros.
   * Protegido: Admin normal no puede editar a Soporte.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateData: { rut?: string; newPassword?: string },
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.update(id, updateData, currentUser);
  }

  /**
   * DELETE /users/:id
   * Admin puede desactivar usuarios.
   * Protegido: Admin normal no puede desactivar a Soporte.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.deactivate(id, user);
  }
}