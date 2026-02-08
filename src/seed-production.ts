/**
 * 🛡️ SEED DE PRODUCCIÓN - FRENOS AGUILERA
 * * Este script garantiza la creación de 4 usuarios clave:
 * 1. Admin Soporte (Tú) -> OCULTO, Rol ADMIN
 * 2. Worker Soporte (Tu equipo) -> OCULTO, Rol WORKER
 * 3. Dueña (Cliente) -> VISIBLE, Rol ADMIN
 * 4. Mecánico (Cliente) -> VISIBLE, Rol WORKER
 * * NOTA: Limpia automáticamente los RUTs (quita puntos y guión) para compatibilidad.
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { UserRole } from './users/enums/user-role.enum';

// Cargar variables de entorno del archivo .env real del servidor
dotenv.config();

// Función para limpiar RUT (Ej: "21.814.036-k" -> "21814036K")
const limpiarRut = (rut: string) => {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
};

async function seedProduction() {
  console.log('🔌 Conectando a la Base de Datos...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1', 
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'taller_db',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    // 👇 ESTO ES LO QUE ARREGLA EL ERROR "COLUMN DOES NOT EXIST"
    synchronize: true, // ✅ TRUE: Permite crear tablas y columnas si no existen
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión exitosa.\n');

    const userRepo = dataSource.getRepository(User);

    // =================================================================
    // FUNCIÓN MAESTRA DE CREACIÓN DE USUARIOS
    // =================================================================
    const gestionarUsuario = async (
      rutOriginal: string, 
      pass: string, 
      nombre: string, 
      rol: UserRole, 
      esSoporte: boolean
    ) => {
      const rutLimpio = limpiarRut(rutOriginal); // "21.814.036-k" -> "21814036K"
      
      let usuario = await userRepo.findOne({ where: { rut: rutLimpio } });
      const hash = await bcrypt.hash(pass, 10);

      if (!usuario) {
        // CREAR SI NO EXISTE
        usuario = userRepo.create({
          rut: rutLimpio,
          password: hash,
          nombre: nombre,
          role: rol,
          isActive: true,
          is_support: esSoporte,
        });
        await userRepo.save(usuario);
        console.log(`✨ CREADO: ${nombre} | RUT: ${rutLimpio} | Rol: ${rol} | Oculto: ${esSoporte}`);
      } else {
        // ACTUALIZAR SI YA EXISTE
        if (esSoporte) {
          usuario.password = hash;
        }
        
        usuario.is_support = esSoporte;
        usuario.role = rol;
        usuario.isActive = true;
        
        await userRepo.save(usuario);
        console.log(`🔄 ACTUALIZADO: ${nombre} | RUT: ${rutLimpio} | Oculto: ${esSoporte}`);
      }
    };

    console.log('🚀 Iniciando inyección de usuarios...\n');

    // -------------------------------------------------------------
    // 1. TUS CUENTAS (SOPORTE INVISIBLE)
    // -------------------------------------------------------------
    
    // Tu cuenta Admin
    await gestionarUsuario(
      '21.814.036-k',      // TU RUT
      'Soporte2026!',      // TU CLAVE
      'Soporte Admin',     // NOMBRE
      UserRole.ADMIN,      // ROL
      true                 // OCULTO
    );

    // Tu cuenta Worker (Para pruebas o compañero)
    await gestionarUsuario(
      '88.888.888-8',      // RUT SECUNDARIO
      'Soporte2026!',
      'Soporte Worker',
      UserRole.WORKER,
      true                 // OCULTO
    );

    // -------------------------------------------------------------
    // 2. CUENTAS DEL CLIENTE (VISIBLE)
    // -------------------------------------------------------------

    // La Dueña
    await gestionarUsuario(
      '11.111.111-1',       // RUT DUEÑA
      'admin123',           // CLAVE DUEÑA
      'Administradora',
      UserRole.ADMIN,
      false                 // VISIBLE
    );

    // El Mecánico
    await gestionarUsuario(
      '22.222.222-2',       // RUT MECÁNICO
      'taller123',
      'Mecánico General',
      UserRole.WORKER,
      false                 // VISIBLE
    );

    console.log('\n✅ PROCESO TERMINADO CORRECTAMENTE.');
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedProduction();