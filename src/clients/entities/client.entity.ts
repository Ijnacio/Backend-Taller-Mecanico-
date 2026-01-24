import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

@Entity()
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true, nullable: true })
  rut: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Index()
  @Column({ nullable: true })
  telefono: string;

  @OneToMany(() => WorkOrder, (order) => order.cliente)
  ordenes: WorkOrder[];
}
