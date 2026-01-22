import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class WorkOrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  servicio_nombre: string; // "Cambio Pastillas", "Rectificado", etc.

  @Column({ type: 'text', nullable: true })
  descripcion: string; // Lo que el mecánico escribió a mano

  @Column('int')
  precio: number; // Lo que se cobró por este servicio

  // === RELACIONES ===
  @ManyToOne(() => WorkOrder, (order) => order.detalles, { onDelete: 'CASCADE' })
  workOrder: WorkOrder;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'RESTRICT' })
  producto: Product; // Si usaron un repuesto del inventario
}
