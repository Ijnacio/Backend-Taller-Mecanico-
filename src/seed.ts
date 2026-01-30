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

dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_DATABASE || 'taller_mecanico',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('🌱 SEED DE DESARROLLO - Iniciando...\n');

  const userRepo = dataSource.getRepository(User);
  const catRepo = dataSource.getRepository(Category);
  const prodRepo = dataSource.getRepository(Product);
  const vehicleModelRepo = dataSource.getRepository(VehicleModel);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const clientRepo = dataSource.getRepository(Client);
  const providerRepo = dataSource.getRepository(Provider);

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

  // 2. CATEGORÍAS
  const categorias = [
    { nombre: 'Pastillas de Freno', descripcion: 'Pastillas delanteras y traseras' },
    { nombre: 'Discos de Freno', descripcion: 'Discos ventilados y sólidos' },
  ];
  const cats: Category[] = [];
  for (const c of categorias) {
    let cat = await catRepo.findOneBy({ nombre: c.nombre });
    if (!cat) cat = await catRepo.save(c);
    cats.push(cat);
  }
  console.log(`✅ Categorías listas`);

  // 3. MODELOS
  const modelosVehiculos = [{ marca: 'Toyota', modelo: 'Yaris', anio: 2018 }];
  const modelos: VehicleModel[] = [];
  for (const m of modelosVehiculos) {
    let mode = await vehicleModelRepo.findOneBy({ marca: m.marca, modelo: m.modelo, anio: m.anio });
    if (!mode) mode = await vehicleModelRepo.save(m);
    modelos.push(mode);
  }

  // 6. CLIENTES (Importante: Se necesitan para los vehículos)
  const clientes = [
    { nombre: 'Juan Pérez', rut: '123456789', email: 'juan@gmail.com', telefono: '+5691' }
  ];
  const clientesGuardados: Client[] = [];
  for (const c of clientes) {
    let cli = await clientRepo.findOneBy({ rut: c.rut });
    if (!cli) cli = await clientRepo.save(c);
    clientesGuardados.push(cli);
  }
  console.log(`✅ Clientes listos`);

  // 7. VEHÍCULOS
  const vehiculos = [
    { patente: 'ABCD12', marca: 'Toyota', modelo: 'Yaris', anio: 2018, kilometraje: 45000, cliente: clientesGuardados[0] }
  ];
  for (const v of vehiculos) {
    let veh = await vehicleRepo.findOneBy({ patente: v.patente });
    if (!veh) await vehicleRepo.save(v);
  }
  console.log(`✅ Vehículos listos`);

  console.log('\n========================================');
  console.log('🏁 SEED COMPLETADO EXITOSAMENTE');
  console.log('========================================\n');

  await dataSource.destroy();
}

// ESTO DEBE IR FUERA DE LA FUNCIÓN SEED
seed().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});