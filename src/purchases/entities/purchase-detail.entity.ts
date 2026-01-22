import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Purchase } from './purchase.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class PurchaseDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  cantidad: number; // Ej: 10 unidades

  @Column('int')
  precio_costo_unitario: number; // Ej: $5.000 (A cómo lo compramos)

  @Column('int')
  total_fila: number; // Ej: $50.000 (10 * 5.000)

  // RELACIONES
  @ManyToOne(() => Purchase, (purchase) => purchase.detalles)
  compra: Purchase;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' }) // Solo referencia para saber qué producto fue
  producto: Product;
}