import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CounterSale } from './counter-sale.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class CounterSaleDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  cantidad: number;

  @Column('int', { default: 0 })
  precio_venta_unitario: number; // Lo que se cobró (solo si es VENTA)

  @Column('int', { default: 0 })
  costo_producto: number; // Costo del producto al momento del movimiento

  @Column('int', { default: 0 })
  total_fila: number; // cantidad * precio_venta (si es venta) o 0

  // === RELACIONES ===
  @ManyToOne(() => CounterSale, (sale) => sale.detalles, { onDelete: 'CASCADE' })
  counterSale: CounterSale;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  producto: Product;
}
