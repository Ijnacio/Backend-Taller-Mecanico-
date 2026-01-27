import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Vehicle: Vehículos de CLIENTES (con patente única).
 * Se usa en órdenes de trabajo para identificar el vehículo del cliente.
 * 
 * NO confundir con VehicleModel (modelos genéricos para compatibilidad de productos).
 */
@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  patente: string; // PATENTE ÚNICA (Ej: ABCD12)

  @Column()
  marca: string; // Ej: Toyota, Nissan

  @Column()
  modelo: string; // Ej: Yaris, V16, Spark

  @Column({ nullable: true })
  anio: number; // Ej: 2018

  @Column({ nullable: true })
  kilometraje: number; // Último kilometraje registrado
}
