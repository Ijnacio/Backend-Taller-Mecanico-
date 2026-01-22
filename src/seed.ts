import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/entities/user.entity';
import { UserRole } from './users/enums/user-role.enum';

/**
 * Script para crear el usuario ADMIN inicial
 * Ejecutar con: npm run seed
 */
async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: 'taller.db',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✓ Conexión a base de datos establecida');

  const userRepository = dataSource.getRepository(User);

  // Verificar si ya existe un admin
  const existingAdmin = await userRepository.findOne({
    where: { rut: '111111111' }
  });

  if (existingAdmin) {
    console.log('⚠️  Ya existe un usuario ADMIN con RUT 11.111.111-1');
    await dataSource.destroy();
    return;
  }

  // Crear usuario ADMIN por defecto
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);

  const admin = new User();
  admin.rut = '111111111'; // RUT normalizado
  admin.password = hashedPassword;
  admin.nombre = 'Administrador';
  admin.role = UserRole.ADMIN;
  admin.isActive = true;

  await userRepository.save(admin);

  console.log('✓ Usuario ADMIN creado exitosamente');
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  CREDENCIALES DE ACCESO INICIAL       ║');
  console.log('╠════════════════════════════════════════╣');
  console.log('║  RUT:        11.111.111-1              ║');
  console.log('║  Contraseña: admin123                  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  IMPORTANTE: Cambia esta contraseña inmediatamente en producción');

  await dataSource.destroy();
}

seedAdmin()
  .then(() => {
    console.log('✓ Seed completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Error en seed:', error);
    process.exit(1);
  });
