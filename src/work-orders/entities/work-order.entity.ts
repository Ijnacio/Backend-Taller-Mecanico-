import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, Index } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { WorkOrderDetail } from './work-order-detail.entity';

@Entity()
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero_orden_papel: number; // El número del talón físico (ÚNICO)

  @Column({ default: 'FINALIZADA' })
  estado: string; // FINALIZADA, EN_PROCESO, CANCELADA

  @Index()
  @CreateDateColumn()
  fecha_ingreso: Date;

  @Column('int', { default: 0 })
  total_cobrado: number;

  @Column()
  realizado_por: string; // Mecánico que hizo el trabajo

  @Column({ nullable: true })
  revisado_por: string; // Supervisor que revisó (NUEVO CAMPO)

  // === SNAPSHOT DEL VEHÍCULO ===
  @Index()
  @Column()
  patente_vehiculo: string; // Guardamos la patente directamente

  @Column({ nullable: true })
  kilometraje: number; // El kilometraje al momento de la orden

  // === RELACIONES ===
  @ManyToOne(() => Client, { nullable: false })
  cliente: Client; // Historial del cliente

  @OneToMany(() => WorkOrderDetail, (detail) => detail.workOrder, { cascade: true })
  detalles: WorkOrderDetail[];
}
