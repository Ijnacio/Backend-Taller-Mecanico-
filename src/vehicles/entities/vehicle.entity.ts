import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

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

  // RELACIÓN MUCHOS A MUCHOS (INVERSA)
  @ManyToMany(() => Product, (product) => product.vehiculosCompatibles)
  productosCompatibles: Product[];
}