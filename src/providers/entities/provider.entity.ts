import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Purchase } from '../../purchases/entities/purchase.entity';

@Entity()
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string; // Ej: "Repuestos Don Gato"

  @Column({ nullable: true })
  telefono: string; // Teléfono de contacto

  @Column({ nullable: true })
  email: string; // Email de contacto

  // Relación: Un proveedor tiene muchas facturas asociadas
  @OneToMany(() => Purchase, (purchase) => purchase.proveedor)
  compras: Purchase[];
}
