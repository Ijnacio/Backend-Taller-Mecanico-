import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rut: string; // RUT normalizado (sin puntos ni guion)

  @Column()
  password: string; // Hash bcrypt

  @Column()
  nombre: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.WORKER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
