import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Purchase } from '../../purchases/entities/purchase.entity';

@Entity()
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string; // Ej: "Repuestos Don Gato"

  // Relación: Un proveedor tiene muchas facturas asociadas
  @OneToMany(() => Purchase, (purchase) => purchase.proveedor)
  compras: Purchase[];
}