import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

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

  @Column({ nullable: true })
  direccion: string;

  // === RELACIONES ===
  @OneToMany(() => WorkOrder, (order) => order.cliente)
  ordenes: WorkOrder[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.cliente)
  vehiculos: Vehicle[];
}
