import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string; // Ej: "Frenos", "Aceites", "Filtros"

  @Column({ nullable: true })
  descripcion: string; // Descripción de la categoría

  // Una categoría tiene muchos productos
  @OneToMany(() => Product, (product) => product.categoria)
  productos: Product[];
}
