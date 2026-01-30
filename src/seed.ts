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
// Si tienes entidades para compras, work-orders, counter-sales, impórtalas aquí

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
    synchronize: true, // ¡Cuidado en producción!
  });

  await dataSource.initialize();
  console.log('🌱 SEED DE DESARROLLO - Datos completos de prueba\n');

  // Repositorios
  const userRepo = dataSource.getRepository(User);
  const catRepo = dataSource.getRepository(Category);
  const prodRepo = dataSource.getRepository(Product);
  const vehicleModelRepo = dataSource.getRepository(VehicleModel);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const clientRepo = dataSource.getRepository(Client);
  const providerRepo = dataSource.getRepository(Provider);
  // Agrega aquí los repos de compras, work-orders, counter-sales si los tienes

  // 1. USUARIOS
  const adminData = {
    rut: '111111111',
    password: await bcrypt.hash('admin123', 10),
    nombre: 'Admin',
    role: UserRole.ADMIN,
    isActive: true,
  };
  let admin = await userRepo.findOneBy({ rut: adminData.rut });
  if (!admin) {
    admin = await userRepo.save(adminData);
    console.log('✅ Usuario ADMIN creado');
  }

  const workerData = {
    rut: '999999999',
    password: await bcrypt.hash('taller123', 10),
    nombre: 'Pedro Mecánico',
    role: UserRole.WORKER,
    isActive: true,
  };
  let worker = await userRepo.findOneBy({ rut: workerData.rut });
  if (!worker) {
    worker = await userRepo.save(workerData);
    console.log('✅ Usuario WORKER creado');
  }

  // 2. CATEGORÍAS
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

  const cats: Category[] = [];
  for (const c of categorias) {
    let cat = await catRepo.findOneBy({ nombre: c.nombre });
    if (!cat) {
      cat = await catRepo.save(c);
    }
    cats.push(cat);
  }
  console.log(`✅ ${cats.length} Categorías verificadas/creadas`);

  // 3. MODELOS DE VEHÍCULO
  const modelosVehiculos = [
    { marca: 'Toyota', modelo: 'Yaris', anio: 2018 },
    { marca: 'Toyota', modelo: 'Corolla', anio: 2020 },
    { marca: 'Toyota', modelo: 'RAV4', anio: 2019 },
    { marca: 'Nissan', modelo: 'V16', anio: 2015 },
    { marca: 'Nissan', modelo: 'Sentra', anio: 2018 },
    { marca: 'Chevrolet', modelo: 'Spark', anio: 2017 },
    { marca: 'Suzuki', modelo: 'Swift', anio: 2018 },
    { marca: 'Hyundai', modelo: 'Accent', anio: 2019 },
    { marca: 'Kia', modelo: 'Morning', anio: 2016 },
    { marca: 'Mazda', modelo: '3', anio: 2018 },
  ];

  const modelos: VehicleModel[] = [];
  for (const m of modelosVehiculos) {
    let mode = await vehicleModelRepo.findOneBy({ marca: m.marca, modelo: m.modelo, anio: m.anio });
    if (!mode) {
      mode = await vehicleModelRepo.save(m);
    }
    modelos.push(mode);
  }
  console.log(`✅ ${modelos.length} Modelos de vehículos verificados/creados`);

  // 4. PRODUCTOS (cada uno con 2-3 modelos compatibles)
  // Nota: Usamos índices basados en el orden de 'cats' y 'modelos' arriba
  // cats[0] = Pastillas, cats[1] = Discos
  // modelos[0] = Yaris 2018, modelos[1] = Corolla 2020 ...

  const productosData = [
    {
      sku: 'PF-001',
      nombre: 'Pastilla Delantera Toyota Yaris',
      marca: 'Bosch',
      calidad: 'Cerámica',
      precio_venta: 28000,
      stock_actual: 15,
      stock_minimo: 3,
      categoria: cats[0],
      modelosCompatibles: [modelos[0], modelos[1], modelos[2]],
    },
    {
      sku: 'PF-002',
      nombre: 'Pastilla Delantera Nissan V16',
      marca: 'Bosch',
      calidad: 'Cerámica',
      precio_venta: 25000,
      stock_actual: 12,
      stock_minimo: 3,
      categoria: cats[0],
      modelosCompatibles: [modelos[3], modelos[4]],
    },
    {
      sku: 'DF-001',
      nombre: 'Disco Ventilado Toyota Yaris Del.',
      marca: 'Brembo',
      calidad: 'Ventilado',
      precio_venta: 45000,
      stock_actual: 6,
      stock_minimo: 2,
      categoria: cats[1],
      modelosCompatibles: [modelos[0], modelos[1]],
    },
    // ...agrega más productos y modelos compatibles
  ];

  const productosGuardados: Product[] = [];
  for (const p of productosData) {
    let prod = await prodRepo.findOneBy({ sku: p.sku });
    if (!prod) {
      const newProd = prodRepo.create(p);
      prod = await prodRepo.save(newProd);
    }
    productosGuardados.push(prod);
  }
  console.log(`✅ ${productosGuardados.length} Productos verificados/creados`);

  // 5. PROVEEDORES
  const proveedores = [
    { nombre: 'Repuestos del Sur', rut: '76.111.111-1', telefono: '+56912345678', email: 'ventas@repuestosdelsur.cl' },
    { nombre: 'Frenos Chile', rut: '76.222.222-2', telefono: '+56987654321', email: 'pedidos@frenoschile.cl' },
    { nombre: 'Distribuidora Bosch', rut: '76.333.333-3', telefono: '+56911112222', email: 'ventas@bosch.cl' },
    { nombre: 'AutoPartes Santiago', rut: '76.444.444-4', telefono: '+56933334444', email: 'contacto@autopartes.cl' },
  ];

  const proveedoresGuardados: Provider[] = [];
  for (const prov of proveedores) {
    let p = await providerRepo.findOneBy({ nombre: prov.nombre });
    if (!p) {
      p = await providerRepo.save(prov);
    } else {
      // Actualizamos RUT si falta
      if (!p.rut && prov.rut) {
        p.rut = prov.rut;
        await providerRepo.save(p);
      }
    }
    proveedoresGuardados.push(p);
  }
  console.log(`✅ ${proveedoresGuardados.length} Proveedores verificados/creados`);

  // 6. CLIENTES
  const clientes = [
    { nombre: 'Juan Pérez González', rut: '123456789', email: 'juan.perez@gmail.com', telefono: '+56912340001' },
    { nombre: 'María López Silva', rut: '987654321', email: 'maria.lopez@gmail.com', telefono: '+56912340002' },
    { nombre: 'Carlos Rodríguez M.', rut: '112233445', email: 'carlos.rod@gmail.com', telefono: '+56912340003' },
    { nombre: 'Ana Martínez P.', rut: '556677889', email: 'ana.martinez@gmail.com', telefono: '+56912340004' },
    { nombre: 'Pedro Sánchez L.', rut: '998877665', email: 'pedro.sanchez@gmail.com', telefono: '+56912340005' },
  ];

  const clientesGuardados: Client[] = [];
  for (const c of clientes) {
    let cli = await clientRepo.findOneBy({ rut: c.rut });
    if (!cli) {
      cli = await clientRepo.save(c);
    }
    clientesGuardados.push(cli);

    console.log(`✅ ${clientesGuardados.length} Clientes verificados/creados`);

    // 7. VEHÍCULOS (asociados a clientes)
    // Usamos los índices de clientesGuardados para asociar
    // clientesGuardados[0] = Juan Pérez
    const vehiculos = [
      { patente: 'ABCD12', marca: 'Toyota', modelo: 'Yaris', anio: 2018, kilometraje: 45000, cliente: clientesGuardados[0] },
      { patente: 'EFGH34', marca: 'Nissan', modelo: 'V16', anio: 2015, kilometraje: 120000, cliente: clientesGuardados[1] },
      { patente: 'IJKL56', marca: 'Chevrolet', modelo: 'Spark', anio: 2017, kilometraje: 68000, cliente: clientesGuardados[2] },
      { patente: 'MNOP78', marca: 'Hyundai', modelo: 'Accent', anio: 2019, kilometraje: 35000, cliente: clientesGuardados[3] },
      { patente: 'QRST90', marca: 'Kia', modelo: 'Morning', anio: 2016, kilometraje: 92000, cliente: clientesGuardados[4] },
      { patente: 'UVWX11', marca: 'Toyota', modelo: 'Corolla', anio: 2020, kilometraje: 28000, cliente: clientesGuardados[0] },
    ];

    const vehiculosGuardados: Vehicle[] = [];
    for (const v of vehiculos) {
      let veh = await vehicleRepo.findOneBy({ patente: v.patente });
      if (!veh) {
        veh = await vehicleRepo.save(v);
      }
      vehiculosGuardados.push(veh);
    }
    console.log(`✅ ${vehiculosGuardados.length} Vehículos verificados/creados`);

    // 8. COMPRAS (ejemplo, si tienes entidad Purchase)
    // ...aquí iría la lógica para crear compras y aumentar stock de productos

    // 9. ÓRDENES DE TRABAJO (ejemplo, si tienes entidad WorkOrder)
    // ...aquí iría la lógica para crear órdenes, asociar cliente, vehículo, productos usados, usuario

    // 10. VENTAS DE MOSTRADOR (ejemplo, si tienes entidad CounterSale)
    // ...aquí iría la lógica para crear ventas de mostrador de distintos tipos

    // 11. RESUMEN FINAL
    console.log('\n========================================');
    console.log('🏁 SEED DE DESARROLLO COMPLETADO');
    console.log('========================================');
    console.log('📊 Datos creados/verificados:');
    console.log('   - 2 Usuarios (ADMIN + WORKER)');
    console.log('   - 8 Categorías de frenos');
    console.log('   - 10+ Modelos de vehículos');
    console.log('   - Productos con modelos compatibles');
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
}