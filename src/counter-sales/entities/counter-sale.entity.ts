import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MovementType } from '../enums/movement-type.enum';
import { CounterSaleDetail } from './counter-sale-detail.entity';

@Entity()
export class CounterSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    enum: MovementType,
  })
  tipo_movimiento: MovementType;

  @CreateDateColumn()
  fecha: Date;

  @Column('int', { default: 0 })
  total_venta: number; // Solo si es VENTA, sino 0

  @Column('int', { default: 0 })
  costo_perdida: number; // Solo si es PERDIDA (costo del producto perdido)

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @Column({ nullable: true })
  comprador: string; // Nombre del cliente (solo VENTA)

  // AUDITORÍA
  @Column({ nullable: true })
  createdByName: string; // Nombre del usuario que registró (trabajador)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CounterSaleDetail, (detail) => detail.counterSale, {
    cascade: true,
  })
  detalles: CounterSaleDetail[];
}
