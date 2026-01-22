import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Category } from '../../categories/entities/category.entity'; // <--- IMPORTAR
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string; // EL CÓDIGO MAESTRO (Ej: A-204)

  @Column()
  nombre: string; // Ej: "Pastilla de Freno Delantera"

  @Column({ nullable: true })
  marca: string; // Ej: "Bosch", "Vier", "Original"

  @Column({ nullable: true })
  calidad: string; // Ej: "Cerámica", "Semimetálica", "Goma"

  @Column('int')
  precio_venta: number;

  @Column('int', { default: 0 })
  stock_actual: number;

  @Column('int', { default: 5 })
  stock_minimo: number; // Para la alerta [cite: 35]

  @ManyToMany(() => Vehicle, (vehicle) => vehicle.productosCompatibles, { cascade: true })
  @JoinTable()
  vehiculosCompatibles: Vehicle[];

  // RELACIÓN CON CATEGORÍA (Para los filtros)
  @ManyToOne(() => Category, (category) => category.productos, { nullable: true })
  categoria: Category;
}