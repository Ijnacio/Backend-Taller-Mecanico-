import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { VehicleModel } from '../../vehicle-models/entities/vehicle-model.entity';

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
  stock_minimo: number; // Para la alerta

  // Modelos de vehículos compatibles (marca + modelo + año, sin patente)
  @ManyToMany(() => VehicleModel, (vehicleModel) => vehicleModel.productos, {
    cascade: true,
  })
  @JoinTable({
    name: 'product_vehicle_models',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'vehicle_model_id', referencedColumnName: 'id' },
  })
  modelosCompatibles: VehicleModel[];

  // RELACIÓN CON CATEGORÍA (Para los filtros)
  @ManyToOne(() => Category, (category) => category.productos, {
    nullable: true,
  })
  categoria: Category;
}
