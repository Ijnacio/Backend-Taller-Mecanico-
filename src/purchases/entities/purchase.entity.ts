import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Provider } from '../../providers/entities/provider.entity';
import { PurchaseDetail } from '././purchase-detail.entity';

@Entity()
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  numero_factura: string; // El número del papel

  @Index()
  @CreateDateColumn()
  fecha: Date;

  // TUS REQUISITOS DE DINERO
  @Column('int', { default: 0 })
  monto_neto: number; // Suma sin IVA

  @Column('int', { default: 0 })
  monto_iva: number; // El 19% (si aplica)

  @Column('int', { default: 0 })
  monto_total: number; // Lo que realmente pagó la señora

  // AUDITORÍA
  @Column({ nullable: true })
  createdByName: string; // Nombre del usuario que registró

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Provider, (provider) => provider.compras)
  proveedor: Provider;

  @OneToMany(() => PurchaseDetail, (detail) => detail.compra, { cascade: true })
  detalles: PurchaseDetail[];
}
