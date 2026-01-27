import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Index } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

/**
 * VehicleModel: Modelos de vehículos para COMPATIBILIDAD de productos.
 * NO confundir con Vehicle (vehículos de clientes con patente).
 * 
 * Ejemplo: "Toyota Yaris 2018" puede ser compatible con "Pastilla Freno F-001"
 */
@Entity()
@Index(['marca', 'modelo', 'anio'], { unique: true })
export class VehicleModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  marca: string; // Ej: Toyota, Nissan, Chevrolet

  @Column()
  modelo: string; // Ej: Yaris, V16, Spark

  @Column({ nullable: true })
  anio: number; // Ej: 2018 (puede ser null para "todos los años")

  @Column({ nullable: true })
  motor: string; // Ej: 1.5L, 2.0T (opcional, para filtros más específicos)

  // Relación inversa con productos
  @ManyToMany(() => Product, (product) => product.modelosCompatibles)
  productos: Product[];
}
