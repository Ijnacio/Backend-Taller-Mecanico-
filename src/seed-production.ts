/**
 * SEED DE PRODUCCIÓN
 * Solo crea los usuarios esenciales (ADMIN y WORKER)
 * Las demás tablas quedan vacías para que el cliente las llene
 * 
 * Ejecutar: npx ts-node src/seed-production.ts
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { UserRole } from './users/enums/user-role.enum';

dotenv.config();

async function seedProduction() {
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
  console.log('🏭 SEED DE PRODUCCIÓN - Solo usuarios esenciales\n');

  const userRepo = dataSource.getRepository(User);

  // ========================================
  // USUARIO ADMIN (Dueña del taller)
  // ========================================
  const rutAdmin = '111111111';
  if (!(await userRepo.findOneBy({ rut: rutAdmin }))) {
    const hash = await bcrypt.hash('admin123', 10);
    await userRepo.save({
      rut: rutAdmin,
      password: hash,
      nombre: 'Administrador',
      role: UserRole.ADMIN,
      isActive: true,
    });
    console.log('✅ Usuario ADMIN creado');
    console.log('   RUT: 11.111.111-1');
    console.log('   Contraseña: admin123');
  } else {
    console.log('⏭️  Usuario ADMIN ya existe');
  }

  // ========================================
  // USUARIO WORKER (Trabajador del taller)
  // ========================================
  const rutWorker = '999999999';
  if (!(await userRepo.findOneBy({ rut: rutWorker }))) {
    const hash = await bcrypt.hash('taller123', 10);
    await userRepo.save({
      rut: rutWorker,
      password: hash,
      nombre: 'Trabajador Taller',
      role: UserRole.WORKER,
      isActive: true,
    });
    console.log('✅ Usuario WORKER creado');
    console.log('   RUT: 99.999.999-9');
    console.log('   Contraseña: taller123');
  } else {
    console.log('⏭️  Usuario WORKER ya existe');
  }

  console.log('\n========================================');
  console.log('🏁 SEED DE PRODUCCIÓN COMPLETADO');
  console.log('========================================');
  console.log('Las demás tablas están vacías para que');
  console.log('el administrador las configure.');
  console.log('========================================\n');

  await dataSource.destroy();
}

seedProduction().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});
