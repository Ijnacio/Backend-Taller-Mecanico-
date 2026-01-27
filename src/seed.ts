import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { VehicleModel } from './vehicle-models/entities/vehicle-model.entity';
import { Vehicle } from './vehicles/entities/vehicle.entity';
import { Client } from './clients/entities/client.entity';
import { Provider } from './providers/entities/provider.entity';
import { UserRole } from './users/enums/user-role.enum';

/**
 * SEED DE DESARROLLO
 * Crea usuarios + datos de prueba completos para testear el sistema
 * 
 * Ejecutar: npm run seed
 * 
 * Para producción usar: npm run seed:prod
 */

dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'taller_mecanico',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('🌱 SEED DE DESARROLLO - Datos completos de prueba\n');

  const userRepo = dataSource.getRepository(User);
  const catRepo = dataSource.getRepository(Category);
  const prodRepo = dataSource.getRepository(Product);
  const vehicleModelRepo = dataSource.getRepository(VehicleModel);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const clientRepo = dataSource.getRepository(Client);
  const providerRepo = dataSource.getRepository(Provider);

  // ========================================
  // 1. USUARIOS
  // ========================================
  const rutAdmin = '111111111';
  if (!(await userRepo.findOneBy({ rut: rutAdmin }))) {
    const hash = await bcrypt.hash('admin123', 10);
    await userRepo.save({
      rut: rutAdmin,
      password: hash,
      nombre: 'María Aguilera',
      role: UserRole.ADMIN,
      isActive: true,
    });
    console.log('✅ Usuario ADMIN creado (11.111.111-1 / admin123)');
  }

  const rutWorker = '999999999';
  if (!(await userRepo.findOneBy({ rut: rutWorker }))) {
    const hash = await bcrypt.hash('taller123', 10);
    await userRepo.save({
      rut: rutWorker,
      password: hash,
      nombre: 'Pedro Mecánico',
      role: UserRole.WORKER,
      isActive: true,
    });
    console.log('✅ Usuario WORKER creado (99.999.999-9 / taller123)');
  }

  // ========================================
  // 2. CATEGORÍAS (específicas para taller de frenos)
  // ========================================
  const categorias = [
    { nombre: 'Pastillas de Freno', descripcion: 'Pastillas delanteras y traseras' },
    { nombre: 'Discos de Freno', descripcion: 'Discos ventilados y sólidos' },
    { nombre: 'Tambores', descripcion: 'Tambores de freno trasero' },
    { nombre: 'Balatas', descripcion: 'Balatas para tambor' },
    { nombre: 'Líquidos', descripcion: 'Líquido de frenos DOT3, DOT4' },
    { nombre: 'Cilindros', descripcion: 'Cilindros de freno y bombines' },
    { nombre: 'Mangueras', descripcion: 'Mangueras y cañerías de freno' },
    { nombre: 'Kits de Reparación', descripcion: 'Kits completos de reparación' },
  ];

  const catsGuardadas: Category[] = [];
  for (const c of categorias) {
    let cat = await catRepo.findOneBy({ nombre: c.nombre });
    if (!cat) {
      cat = await catRepo.save(c);
    }
    catsGuardadas.push(cat);
  }
  console.log('✅ 8 Categorías de frenos creadas');

  // ========================================
  // 3. MODELOS DE VEHÍCULOS (autos populares en Chile)
  // ========================================
  const modelosVehiculos = [
    // Toyota
    { marca: 'Toyota', modelo: 'Yaris', anio: 2015 },
    { marca: 'Toyota', modelo: 'Yaris', anio: 2018 },
    { marca: 'Toyota', modelo: 'Yaris', anio: 2020 },
    { marca: 'Toyota', modelo: 'Corolla', anio: 2018 },
    { marca: 'Toyota', modelo: 'Corolla', anio: 2022 },
    { marca: 'Toyota', modelo: 'RAV4', anio: 2019 },
    // Nissan
    { marca: 'Nissan', modelo: 'V16', anio: 2012 },
    { marca: 'Nissan', modelo: 'V16', anio: 2015 },
    { marca: 'Nissan', modelo: 'Sentra', anio: 2018 },
    { marca: 'Nissan', modelo: 'Qashqai', anio: 2020 },
    // Chevrolet
    { marca: 'Chevrolet', modelo: 'Spark', anio: 2015 },
    { marca: 'Chevrolet', modelo: 'Spark', anio: 2018 },
    { marca: 'Chevrolet', modelo: 'Sail', anio: 2017 },
    // Suzuki
    { marca: 'Suzuki', modelo: 'Swift', anio: 2018 },
    { marca: 'Suzuki', modelo: 'Baleno', anio: 2019 },
    // Hyundai
    { marca: 'Hyundai', modelo: 'Accent', anio: 2018 },
    { marca: 'Hyundai', modelo: 'Tucson', anio: 2020 },
    // Kia
    { marca: 'Kia', modelo: 'Morning', anio: 2017 },
    { marca: 'Kia', modelo: 'Rio', anio: 2019 },
    // Mazda
    { marca: 'Mazda', modelo: '3', anio: 2018 },
    { marca: 'Mazda', modelo: 'CX-5', anio: 2020 },
  ];

  const modelosGuardados: VehicleModel[] = [];
  for (const m of modelosVehiculos) {
    let modelo = await vehicleModelRepo.findOne({
      where: { marca: m.marca, modelo: m.modelo, anio: m.anio },
    });
    if (!modelo) {
      modelo = await vehicleModelRepo.save(m);
    }
    modelosGuardados.push(modelo);
  }
  console.log('✅ 21 Modelos de vehículos populares creados');

  // ========================================
  // 4. PRODUCTOS (repuestos de frenos reales)
  // ========================================
  const productos = [
    // Pastillas
    { sku: 'PF-001', nombre: 'Pastilla Delantera Toyota Yaris', marca: 'Bosch', calidad: 'Cerámica', precio: 28000, stock: 15, min: 3, catIdx: 0 },
    { sku: 'PF-002', nombre: 'Pastilla Delantera Nissan V16', marca: 'Bosch', calidad: 'Cerámica', precio: 25000, stock: 12, min: 3, catIdx: 0 },
    { sku: 'PF-003', nombre: 'Pastilla Delantera Chevrolet Spark', marca: 'TRW', calidad: 'Semimetálica', precio: 22000, stock: 8, min: 2, catIdx: 0 },
    { sku: 'PF-004', nombre: 'Pastilla Trasera Toyota Corolla', marca: 'Brembo', calidad: 'Cerámica', precio: 32000, stock: 6, min: 2, catIdx: 0 },
    { sku: 'PF-005', nombre: 'Pastilla Delantera Hyundai Accent', marca: 'Sangsin', calidad: 'Original', precio: 35000, stock: 4, min: 2, catIdx: 0 },
    // Discos
    { sku: 'DF-001', nombre: 'Disco Ventilado Toyota Yaris Del.', marca: 'Brembo', calidad: 'Ventilado', precio: 45000, stock: 6, min: 2, catIdx: 1 },
    { sku: 'DF-002', nombre: 'Disco Ventilado Nissan V16 Del.', marca: 'TRW', calidad: 'Ventilado', precio: 38000, stock: 4, min: 2, catIdx: 1 },
    { sku: 'DF-003', nombre: 'Disco Sólido Chevrolet Spark Tras.', marca: 'Valeo', calidad: 'Sólido', precio: 28000, stock: 3, min: 2, catIdx: 1 },
    // Tambores
    { sku: 'TB-001', nombre: 'Tambor Trasero Nissan V16', marca: 'Original', calidad: 'OEM', precio: 35000, stock: 4, min: 1, catIdx: 2 },
    { sku: 'TB-002', nombre: 'Tambor Trasero Toyota Yaris', marca: 'TRW', calidad: 'Aftermarket', precio: 32000, stock: 3, min: 1, catIdx: 2 },
    // Balatas
    { sku: 'BL-001', nombre: 'Balata Trasera Nissan V16', marca: 'Fras-le', calidad: 'Standard', precio: 18000, stock: 10, min: 3, catIdx: 3 },
    { sku: 'BL-002', nombre: 'Balata Trasera Chevrolet Spark', marca: 'Cobreq', calidad: 'Standard', precio: 15000, stock: 8, min: 3, catIdx: 3 },
    // Líquidos
    { sku: 'LF-001', nombre: 'Líquido de Frenos DOT4 500ml', marca: 'Bosch', calidad: 'DOT4', precio: 8000, stock: 20, min: 5, catIdx: 4 },
    { sku: 'LF-002', nombre: 'Líquido de Frenos DOT3 1L', marca: 'Wagner', calidad: 'DOT3', precio: 12000, stock: 15, min: 5, catIdx: 4 },
    // Cilindros
    { sku: 'CF-001', nombre: 'Cilindro Maestro Toyota Yaris', marca: 'ATE', calidad: 'Original', precio: 85000, stock: 2, min: 1, catIdx: 5 },
    { sku: 'CF-002', nombre: 'Bombín Rueda Nissan V16', marca: 'TRW', calidad: 'Aftermarket', precio: 25000, stock: 4, min: 2, catIdx: 5 },
    // Mangueras
    { sku: 'MF-001', nombre: 'Manguera Freno Delantera Universal', marca: 'Gates', calidad: 'Reforzada', precio: 15000, stock: 6, min: 2, catIdx: 6 },
    { sku: 'MF-002', nombre: 'Cañería de Freno 3/16 x 1m', marca: 'Bundy', calidad: 'Cobre', precio: 5000, stock: 10, min: 3, catIdx: 6 },
    // Kits
    { sku: 'KF-001', nombre: 'Kit Sellos Cilindro Maestro Yaris', marca: 'Frenosa', calidad: 'Completo', precio: 12000, stock: 3, min: 1, catIdx: 7 },
    { sku: 'KF-002', nombre: 'Kit Reparación Caliper Delantero', marca: 'Frenosa', calidad: 'Completo', precio: 18000, stock: 4, min: 2, catIdx: 7 },
  ];

  for (const p of productos) {
    if (!(await prodRepo.findOneBy({ sku: p.sku }))) {
      await prodRepo.save({
        sku: p.sku,
        nombre: p.nombre,
        marca: p.marca,
        calidad: p.calidad,
        precio_venta: p.precio,
        stock_actual: p.stock,
        stock_minimo: p.min,
        categoria: catsGuardadas[p.catIdx],
      });
    }
  }
  console.log('✅ 20 Productos de frenos creados');

  // ========================================
  // 5. PROVEEDORES
  // ========================================
  const proveedores = [
    { nombre: 'Repuestos del Sur', telefono: '+56912345678', email: 'ventas@repuestosdelsur.cl' },
    { nombre: 'Frenos Chile', telefono: '+56987654321', email: 'pedidos@frenoschile.cl' },
    { nombre: 'Distribuidora Bosch', telefono: '+56911112222', email: 'ventas@bosch.cl' },
    { nombre: 'AutoPartes Santiago', telefono: '+56933334444', email: 'contacto@autopartes.cl' },
  ];

  for (const p of proveedores) {
    if (!(await providerRepo.findOneBy({ nombre: p.nombre }))) {
      await providerRepo.save(p);
    }
  }
  console.log('✅ 4 Proveedores creados');

  // ========================================
  // 6. CLIENTES DE PRUEBA
  // ========================================
  const clientes = [
    { nombre: 'Juan Pérez González', rut: '123456789', email: 'juan.perez@gmail.com', telefono: '+56912340001' },
    { nombre: 'María López Silva', rut: '987654321', email: 'maria.lopez@gmail.com', telefono: '+56912340002' },
    { nombre: 'Carlos Rodríguez M.', rut: '112233445', email: 'carlos.rod@gmail.com', telefono: '+56912340003' },
    { nombre: 'Ana Martínez P.', rut: '556677889', email: 'ana.martinez@gmail.com', telefono: '+56912340004' },
    { nombre: 'Pedro Sánchez L.', rut: '998877665', email: 'pedro.sanchez@gmail.com', telefono: '+56912340005' },
  ];

  for (const c of clientes) {
    if (!(await clientRepo.findOneBy({ rut: c.rut }))) {
      await clientRepo.save(c);
    }
  }
  console.log('✅ 5 Clientes de prueba creados');

  // ========================================
  // 7. VEHÍCULOS DE CLIENTES
  // ========================================
  const vehiculos = [
    { patente: 'ABCD12', marca: 'Toyota', modelo: 'Yaris', anio: 2018, kilometraje: 45000 },
    { patente: 'EFGH34', marca: 'Nissan', modelo: 'V16', anio: 2015, kilometraje: 120000 },
    { patente: 'IJKL56', marca: 'Chevrolet', modelo: 'Spark', anio: 2017, kilometraje: 68000 },
    { patente: 'MNOP78', marca: 'Hyundai', modelo: 'Accent', anio: 2019, kilometraje: 35000 },
    { patente: 'QRST90', marca: 'Kia', modelo: 'Morning', anio: 2016, kilometraje: 92000 },
    { patente: 'UVWX11', marca: 'Toyota', modelo: 'Corolla', anio: 2020, kilometraje: 28000 },
  ];

  for (const v of vehiculos) {
    if (!(await vehicleRepo.findOneBy({ patente: v.patente }))) {
      await vehicleRepo.save(v);
    }
  }
  console.log('✅ 6 Vehículos de clientes creados');

  // ========================================
  // RESUMEN FINAL
  // ========================================
  console.log('\n========================================');
  console.log('🏁 SEED DE DESARROLLO COMPLETADO');
  console.log('========================================');
  console.log('📊 Datos creados:');
  console.log('   - 2 Usuarios (ADMIN + WORKER)');
  console.log('   - 8 Categorías de frenos');
  console.log('   - 21 Modelos de vehículos');
  console.log('   - 20 Productos de repuestos');
  console.log('   - 4 Proveedores');
  console.log('   - 5 Clientes');
  console.log('   - 6 Vehículos');
  console.log('========================================\n');

  await dataSource.destroy();
}

seed().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});