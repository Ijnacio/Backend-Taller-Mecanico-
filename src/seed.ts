import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { UserRole } from './users/enums/user-role.enum';

/**
 * SEED COMPLETO - Taller Frenos Aguilera
 * Ejecutar con: npm run seed
 * 
 * Crea:
 * - 2 Usuarios (ADMIN + WORKER)
 * - 4 Categorías
 * - 3 Productos de prueba (1 con stock bajo para probar alerta)
 */
async function seed() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: 'taller.db',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('🌱 Iniciando carga de datos (Seed)...\n');

  const userRepo = dataSource.getRepository(User);
  const catRepo = dataSource.getRepository(Category);
  const prodRepo = dataSource.getRepository(Product);

  // =========================================================
  // 1. USUARIOS
  // =========================================================
  
  // ADMIN (Dueña - Jefa del Taller)
  const rutAdmin = '111111111';
  if (!(await userRepo.findOneBy({ rut: rutAdmin }))) {
    const hash = await bcrypt.hash('admin123', 10);
    await userRepo.save({
      rut: rutAdmin,
      password: hash,
      nombre: 'Administradora',
      role: UserRole.ADMIN,
      isActive: true
    });
    console.log('✅ Usuario ADMIN creado');
  } else {
    console.log('⏭️  Usuario ADMIN ya existe');
  }

  // WORKER (Cuenta compartida del Taller)
  const rutTaller = '999999999';
  if (!(await userRepo.findOneBy({ rut: rutTaller }))) {
    const hash = await bcrypt.hash('taller123', 10);
    await userRepo.save({
      rut: rutTaller,
      password: hash,
      nombre: 'Taller General',
      role: UserRole.WORKER,
      isActive: true
    });
    console.log('✅ Usuario WORKER creado');
  } else {
    console.log('⏭️  Usuario WORKER ya existe');
  }

  // =========================================================
  // 2. CATEGORÍAS
  // =========================================================
  const categorias = ['Frenos', 'Suspensión', 'Motor', 'Lubricantes'];
  const catsGuardadas: Category[] = [];
  
  for (const nombre of categorias) {
    let cat = await catRepo.findOneBy({ nombre });
    if (!cat) {
      cat = await catRepo.save({ nombre, descripcion: `Repuestos de ${nombre}` });
    }
    catsGuardadas.push(cat);
  }
  console.log('✅ Categorías creadas/verificadas');

  // =========================================================
  // 3. PRODUCTOS DE PRUEBA
  // =========================================================
  const productos = [
    { sku: 'F-001', nombre: 'Pastilla Delantera Yaris', precio: 25000, stock: 10, min: 2, cat: catsGuardadas[0] },
    { sku: 'F-002', nombre: 'Disco Ventilado', precio: 18000, stock: 4, min: 5, cat: catsGuardadas[0] }, // ⚠️ Stock Bajo!
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
        categoria: p.cat
      });
    }
  }
  console.log('✅ Productos de prueba cargados');

  // =========================================================
  // RESUMEN FINAL
  // =========================================================
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║               🏁 SEED FINALIZADO CON ÉXITO                ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║                                                           ║');
  console.log('║  👤 USUARIO ADMIN (Dueña):                                ║');
  console.log('║     RUT:        11.111.111-1                              ║');
  console.log('║     Contraseña: admin123                                  ║');
  console.log('║                                                           ║');
  console.log('║  👷 USUARIO WORKER (Taller):                              ║');
  console.log('║     RUT:        99.999.999-9                              ║');
  console.log('║     Contraseña: taller123                                 ║');
  console.log('║                                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  ⚠️  IMPORTANTE: Cambia estas contraseñas en producción   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  await dataSource.destroy();
}

seed().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});
