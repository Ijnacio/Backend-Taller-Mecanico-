import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { VehicleModel } from './vehicle-models/entities/vehicle-model.entity';
import { UserRole } from './users/enums/user-role.enum';

dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres', 
    host: process.env.DB_HOST || 'localhost',
    // PARCHE: parseInt para el puerto
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'taller_mecanico',
    entities: [__dirname + '/**/*.entity{.ts,.js}'], 
    synchronize: true, 
  });

  await dataSource.initialize();
  console.log('🌱 Iniciando carga de datos (Seed) en POSTGRES...\n');

  const userRepo = dataSource.getRepository(User);
  const catRepo = dataSource.getRepository(Category);
  const prodRepo = dataSource.getRepository(Product);
  const vehicleModelRepo = dataSource.getRepository(VehicleModel);

  // 1. USUARIOS
  const rutAdmin = '111111111';
  if (!(await userRepo.findOneBy({ rut: rutAdmin }))) {
    const hash = await bcrypt.hash('admin123', 10);
    await userRepo.save({
      rut: rutAdmin,
      password: hash,
      nombre: 'Administradora',
      role: UserRole.ADMIN,
      isActive: true,
    });
    console.log('✅ Usuario ADMIN creado');
  } else {
    console.log('⏭️  Usuario ADMIN ya existe');
  }

  const rutTaller = '999999999';
  if (!(await userRepo.findOneBy({ rut: rutTaller }))) {
    const hash = await bcrypt.hash('taller123', 10);
    await userRepo.save({
      rut: rutTaller,
      password: hash,
      nombre: 'Taller General',
      role: UserRole.WORKER,
      isActive: true,
    });
    console.log('✅ Usuario WORKER creado');
  } else {
    console.log('⏭️  Usuario WORKER ya existe');
  }

  // 2. CATEGORÍAS
  const categorias = ['Frenos', 'Suspensión', 'Motor', 'Lubricantes'];
  // PARCHE: Tipado any[] para poder hacer push sin error
  const catsGuardadas: any[] = [];

  for (const nombre of categorias) {
    let cat = await catRepo.findOneBy({ nombre });
    if (!cat) {
      cat = await catRepo.save({
        nombre,
        descripcion: `Repuestos de ${nombre}`,
      });
    }
    catsGuardadas.push(cat);
  }
  console.log('✅ Categorías creadas/verificadas');

  // 3. MODELOS DE VEHÍCULOS (para compatibilidad de productos)
  const modelosVehiculos = [
    { marca: 'Toyota', modelo: 'Yaris', anio: 2018 },
    { marca: 'Toyota', modelo: 'Yaris', anio: 2019 },
    { marca: 'Toyota', modelo: 'Corolla', anio: 2020 },
    { marca: 'Nissan', modelo: 'V16', anio: 2015 },
    { marca: 'Chevrolet', modelo: 'Spark', anio: 2017 },
  ];

  const modelosGuardados: VehicleModel[] = [];
  for (const m of modelosVehiculos) {
    let modelo = await vehicleModelRepo.findOne({
      where: { marca: m.marca, modelo: m.modelo, anio: m.anio },
    });
    if (!modelo) {
      modelo = await vehicleModelRepo.save({
        marca: m.marca,
        modelo: m.modelo,
        anio: m.anio,
      });
    }
    modelosGuardados.push(modelo);
  }
  console.log('✅ Modelos de vehículos creados/verificados');

  // 4. PRODUCTOS
  const productos = [
    { sku: 'F-001', nombre: 'Pastilla Delantera Yaris', precio: 25000, stock: 10, min: 2, cat: catsGuardadas[0] },
    { sku: 'F-002', nombre: 'Disco Ventilado', precio: 18000, stock: 4, min: 5, cat: catsGuardadas[0] },
    { sku: 'L-001', nombre: 'Aceite 10W40', precio: 35000, stock: 20, min: 5, cat: catsGuardadas[3] },
  ];

  for (const p of productos) {
    if (!(await prodRepo.findOneBy({ sku: p.sku }))) {
      await prodRepo.save({
        sku: p.sku,
        nombre: p.nombre,
        marca: 'Genérica',
        precio_venta: p.precio,
        stock_actual: p.stock,
        stock_minimo: p.min,
        categoria: p.cat,
      });
    }
  }
  console.log('✅ Productos de prueba cargados');

  console.log('\n🏁 SEED FINALIZADO CON ÉXITO EN POSTGRES 🏁\n');
  await dataSource.destroy();
}

seed().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});