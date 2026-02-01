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
import { Purchase } from './purchases/entities/purchase.entity';
import { PurchaseDetail } from './purchases/entities/purchase-detail.entity';
import { WorkOrder } from './work-orders/entities/work-order.entity';
import { WorkOrderDetail } from './work-orders/entities/work-order-detail.entity';
import { CounterSale } from './counter-sales/entities/counter-sale.entity';
import { CounterSaleDetail } from './counter-sales/entities/counter-sale-detail.entity';
import { UserRole } from './users/enums/user-role.enum';
import { MovementType } from './counter-sales/enums/movement-type.enum';

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
  console.log('🌱 SEED COMPLETO DE DESARROLLO - Iniciando...\n');

  // ============================================================
  // REPOSITORIOS
  // ============================================================
  const userRepo = dataSource.getRepository(User);
  const catRepo = dataSource.getRepository(Category);
  const prodRepo = dataSource.getRepository(Product);
  const vehicleModelRepo = dataSource.getRepository(VehicleModel);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const clientRepo = dataSource.getRepository(Client);
  const providerRepo = dataSource.getRepository(Provider);
  const purchaseRepo = dataSource.getRepository(Purchase);
  const purchaseDetailRepo = dataSource.getRepository(PurchaseDetail);
  const workOrderRepo = dataSource.getRepository(WorkOrder);
  const workOrderDetailRepo = dataSource.getRepository(WorkOrderDetail);
  const counterSaleRepo = dataSource.getRepository(CounterSale);
  const counterSaleDetailRepo = dataSource.getRepository(CounterSaleDetail);

  // ============================================================
  // 1. USUARIOS
  // ============================================================
  console.log('👤 Creando usuarios...');
  
  const usuarios = [
    { rut: '111111111', password: 'admin123', nombre: 'María Aguilera', role: UserRole.ADMIN },
    { rut: '222222222', password: 'taller123', nombre: 'Trabajador Taller', role: UserRole.WORKER },
  ];

  for (const u of usuarios) {
    let user = await userRepo.findOneBy({ rut: u.rut });
    if (!user) {
      user = userRepo.create({
        rut: u.rut,
        password: await bcrypt.hash(u.password, 10),
        nombre: u.nombre,
        role: u.role,
        isActive: true,
      });
      await userRepo.save(user);
      console.log(`   ✅ Usuario ${u.nombre} (${u.role}) creado`);
    }
  }

  // ============================================================
  // 2. CATEGORÍAS
  // ============================================================
  console.log('\n📂 Creando categorías...');
  
  const categorias = [
    { nombre: 'Pastillas de Freno', descripcion: 'Pastillas delanteras y traseras para todo tipo de vehículos' },
    { nombre: 'Discos de Freno', descripcion: 'Discos ventilados y sólidos' },
    { nombre: 'Tambores', descripcion: 'Tambores de freno trasero' },
    { nombre: 'Balatas', descripcion: 'Balatas para sistema de tambor' },
    { nombre: 'Líquidos de Freno', descripcion: 'DOT3, DOT4 y DOT5' },
    { nombre: 'Cilindros y Bombines', descripcion: 'Cilindros maestros y de rueda' },
    { nombre: 'Mangueras', descripcion: 'Mangueras y cañerías de freno' },
    { nombre: 'Kits de Reparación', descripcion: 'Kits completos para reparación de frenos' },
  ];

  const catsGuardadas: Category[] = [];
  for (const c of categorias) {
    let cat = await catRepo.findOneBy({ nombre: c.nombre });
    if (!cat) {
      cat = await catRepo.save(c);
    }
    catsGuardadas.push(cat);
  }
  console.log(`   ✅ ${catsGuardadas.length} categorías listas`);

  // ============================================================
  // 3. MODELOS DE VEHÍCULOS (Para compatibilidad de productos)
  // ============================================================
  console.log('\n🚗 Creando modelos de vehículos...');
  
  const modelosData = [
    { marca: 'Toyota', modelo: 'Yaris', anio: 2015 },
    { marca: 'Toyota', modelo: 'Yaris', anio: 2018 },
    { marca: 'Toyota', modelo: 'Yaris', anio: 2020 },
    { marca: 'Toyota', modelo: 'Corolla', anio: 2018 },
    { marca: 'Toyota', modelo: 'Corolla', anio: 2020 },
    { marca: 'Toyota', modelo: 'RAV4', anio: 2019 },
    { marca: 'Nissan', modelo: 'V16', anio: 2010 },
    { marca: 'Nissan', modelo: 'V16', anio: 2015 },
    { marca: 'Nissan', modelo: 'Sentra', anio: 2018 },
    { marca: 'Nissan', modelo: 'Versa', anio: 2020 },
    { marca: 'Chevrolet', modelo: 'Spark', anio: 2015 },
    { marca: 'Chevrolet', modelo: 'Spark', anio: 2018 },
    { marca: 'Chevrolet', modelo: 'Sail', anio: 2017 },
    { marca: 'Suzuki', modelo: 'Swift', anio: 2018 },
    { marca: 'Suzuki', modelo: 'Baleno', anio: 2019 },
    { marca: 'Hyundai', modelo: 'Accent', anio: 2018 },
    { marca: 'Hyundai', modelo: 'Accent', anio: 2020 },
    { marca: 'Hyundai', modelo: 'Tucson', anio: 2019 },
    { marca: 'Kia', modelo: 'Morning', anio: 2015 },
    { marca: 'Kia', modelo: 'Morning', anio: 2018 },
    { marca: 'Kia', modelo: 'Rio', anio: 2019 },
    { marca: 'Mazda', modelo: '3', anio: 2018 },
    { marca: 'Mazda', modelo: 'CX-5', anio: 2019 },
  ];

  const modelosGuardados: VehicleModel[] = [];
  for (const m of modelosData) {
    let modelo = await vehicleModelRepo.findOneBy({ marca: m.marca, modelo: m.modelo, anio: m.anio });
    if (!modelo) {
      modelo = await vehicleModelRepo.save(m);
    }
    modelosGuardados.push(modelo);
  }
  console.log(`   ✅ ${modelosGuardados.length} modelos de vehículos listos`);

  // ============================================================
  // 4. PROVEEDORES
  // ============================================================
  console.log('\n🏭 Creando proveedores...');
  
  const proveedoresData = [
    { nombre: 'Repuestos del Sur', rut: '76111111-1', telefono: '+56912345678', email: 'ventas@repuestosdelsur.cl' },
    { nombre: 'Frenos Chile Ltda', rut: '76222222-2', telefono: '+56987654321', email: 'pedidos@frenoschile.cl' },
    { nombre: 'Distribuidora Bosch', rut: '76333333-3', telefono: '+56911112222', email: 'ventas@bosch.cl' },
    { nombre: 'AutoPartes Santiago', rut: '76444444-4', telefono: '+56933334444', email: 'contacto@autopartes.cl' },
    { nombre: 'Importadora Brembo', rut: '76555555-5', telefono: '+56955556666', email: 'ventas@brembo.cl' },
  ];

  const proveedoresGuardados: Provider[] = [];
  for (const p of proveedoresData) {
    let prov = await providerRepo.findOneBy({ rut: p.rut });
    if (!prov) {
      prov = await providerRepo.save(p);
    }
    proveedoresGuardados.push(prov);
  }
  console.log(`   ✅ ${proveedoresGuardados.length} proveedores listos`);

  // ============================================================
  // 5. CLIENTES
  // ============================================================
  console.log('\n👥 Creando clientes...');
  
  const clientesData = [
    { nombre: 'Juan Pérez González', rut: '12345678-9', email: 'juan.perez@gmail.com', telefono: '+56912340001' },
    { nombre: 'María López Silva', rut: '98765432-1', email: 'maria.lopez@gmail.com', telefono: '+56912340002' },
    { nombre: 'Carlos Rodríguez M.', rut: '11223344-5', email: 'carlos.rod@gmail.com', telefono: '+56912340003' },
    { nombre: 'Ana Martínez Pérez', rut: '55667788-9', email: 'ana.martinez@gmail.com', telefono: '+56912340004' },
    { nombre: 'Pedro Sánchez López', rut: '99887766-5', email: 'pedro.sanchez@gmail.com', telefono: '+56912340005' },
    { nombre: 'Empresa TransportesCL', rut: '76999999-9', email: 'flota@transportes.cl', telefono: '+56922223333' },
  ];

  const clientesGuardados: Client[] = [];
  for (const c of clientesData) {
    // Normalizar RUT
    const rutNorm = c.rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    let cli = await clientRepo.findOneBy({ rut: rutNorm });
    if (!cli) {
      cli = await clientRepo.save({ ...c, rut: rutNorm, email: c.email.toLowerCase() });
    }
    clientesGuardados.push(cli);
  }
  console.log(`   ✅ ${clientesGuardados.length} clientes listos`);

  // ============================================================
  // 6. PRODUCTOS (con categorías y modelos compatibles)
  // ============================================================
  console.log('\n📦 Creando productos...');
  
  // Helper para obtener modelos por marca
  const getModelosPorMarca = (marca: string) => modelosGuardados.filter(m => m.marca === marca);
  const getToyota = () => getModelosPorMarca('Toyota');
  const getNissan = () => getModelosPorMarca('Nissan');
  const getChevrolet = () => getModelosPorMarca('Chevrolet');
  const getHyundai = () => getModelosPorMarca('Hyundai');
  const getKia = () => getModelosPorMarca('Kia');

  const productosData = [
    // PASTILLAS DE FRENO
    { sku: 'PF-TOY-001', nombre: 'Pastilla Delantera Toyota Yaris/Corolla', marca: 'Bosch', calidad: 'Cerámica', precio_venta: 28000, stock_actual: 0, categoria: catsGuardadas[0], modelosCompatibles: getToyota().slice(0, 5) },
    { sku: 'PF-TOY-002', nombre: 'Pastilla Trasera Toyota Yaris', marca: 'Bosch', calidad: 'Cerámica', precio_venta: 24000, stock_actual: 0, categoria: catsGuardadas[0], modelosCompatibles: getToyota().slice(0, 3) },
    { sku: 'PF-NIS-001', nombre: 'Pastilla Delantera Nissan V16/Sentra', marca: 'Brembo', calidad: 'Cerámica', precio_venta: 26000, stock_actual: 0, categoria: catsGuardadas[0], modelosCompatibles: getNissan() },
    { sku: 'PF-CHE-001', nombre: 'Pastilla Delantera Chevrolet Spark/Sail', marca: 'Ferodo', calidad: 'Semimetálica', precio_venta: 22000, stock_actual: 0, categoria: catsGuardadas[0], modelosCompatibles: getChevrolet() },
    { sku: 'PF-HYU-001', nombre: 'Pastilla Delantera Hyundai Accent', marca: 'Bosch', calidad: 'Cerámica', precio_venta: 27000, stock_actual: 0, categoria: catsGuardadas[0], modelosCompatibles: getHyundai() },
    { sku: 'PF-KIA-001', nombre: 'Pastilla Delantera Kia Morning/Rio', marca: 'Brembo', calidad: 'Cerámica', precio_venta: 25000, stock_actual: 0, categoria: catsGuardadas[0], modelosCompatibles: getKia() },
    
    // DISCOS DE FRENO
    { sku: 'DF-TOY-001', nombre: 'Disco Ventilado Delantero Toyota Yaris', marca: 'Brembo', calidad: 'Ventilado', precio_venta: 45000, stock_actual: 0, categoria: catsGuardadas[1], modelosCompatibles: getToyota().slice(0, 3) },
    { sku: 'DF-TOY-002', nombre: 'Disco Ventilado Delantero Toyota Corolla', marca: 'Brembo', calidad: 'Ventilado', precio_venta: 52000, stock_actual: 0, categoria: catsGuardadas[1], modelosCompatibles: getToyota().slice(3, 5) },
    { sku: 'DF-NIS-001', nombre: 'Disco Sólido Delantero Nissan V16', marca: 'Fremax', calidad: 'Sólido', precio_venta: 38000, stock_actual: 0, categoria: catsGuardadas[1], modelosCompatibles: getNissan().slice(0, 2) },
    { sku: 'DF-CHE-001', nombre: 'Disco Sólido Delantero Chevrolet Spark', marca: 'Fremax', calidad: 'Sólido', precio_venta: 32000, stock_actual: 0, categoria: catsGuardadas[1], modelosCompatibles: getChevrolet().slice(0, 2) },
    
    // TAMBORES
    { sku: 'TB-TOY-001', nombre: 'Tambor Trasero Toyota Yaris', marca: 'Fremax', calidad: 'Original', precio_venta: 35000, stock_actual: 0, categoria: catsGuardadas[2], modelosCompatibles: getToyota().slice(0, 3) },
    { sku: 'TB-NIS-001', nombre: 'Tambor Trasero Nissan V16', marca: 'Fremax', calidad: 'Original', precio_venta: 33000, stock_actual: 0, categoria: catsGuardadas[2], modelosCompatibles: getNissan().slice(0, 2) },
    
    // BALATAS
    { sku: 'BL-TOY-001', nombre: 'Balatas Traseras Toyota Yaris', marca: 'Bosch', calidad: 'Original', precio_venta: 18000, stock_actual: 0, categoria: catsGuardadas[3], modelosCompatibles: getToyota().slice(0, 3) },
    { sku: 'BL-NIS-001', nombre: 'Balatas Traseras Nissan V16', marca: 'Bosch', calidad: 'Original', precio_venta: 16000, stock_actual: 0, categoria: catsGuardadas[3], modelosCompatibles: getNissan().slice(0, 2) },
    
    // LÍQUIDOS
    { sku: 'LF-DOT4-001', nombre: 'Líquido de Frenos DOT4 500ml', marca: 'Bosch', calidad: 'DOT4', precio_venta: 8000, stock_actual: 0, categoria: catsGuardadas[4], modelosCompatibles: [] },
    { sku: 'LF-DOT4-002', nombre: 'Líquido de Frenos DOT4 1L', marca: 'Prestone', calidad: 'DOT4', precio_venta: 12000, stock_actual: 0, categoria: catsGuardadas[4], modelosCompatibles: [] },
    { sku: 'LF-DOT3-001', nombre: 'Líquido de Frenos DOT3 500ml', marca: 'Mobil', calidad: 'DOT3', precio_venta: 6000, stock_actual: 0, categoria: catsGuardadas[4], modelosCompatibles: [] },
    
    // CILINDROS
    { sku: 'CM-TOY-001', nombre: 'Cilindro Maestro Toyota Yaris', marca: 'TRW', calidad: 'Original', precio_venta: 85000, stock_actual: 0, categoria: catsGuardadas[5], modelosCompatibles: getToyota().slice(0, 3) },
    { sku: 'CB-TOY-001', nombre: 'Bombín Trasero Toyota Yaris', marca: 'TRW', calidad: 'Original', precio_venta: 25000, stock_actual: 0, categoria: catsGuardadas[5], modelosCompatibles: getToyota().slice(0, 3) },
    
    // MANGUERAS
    { sku: 'MG-UNIV-001', nombre: 'Manguera Flexible Freno Universal', marca: 'Gates', calidad: 'Reforzada', precio_venta: 15000, stock_actual: 0, categoria: catsGuardadas[6], modelosCompatibles: [] },
  ];

  const productosGuardados: Product[] = [];
  for (const p of productosData) {
    let prod = await prodRepo.findOneBy({ sku: p.sku });
    if (!prod) {
      prod = prodRepo.create(p);
      prod = await prodRepo.save(prod);
    }
    productosGuardados.push(prod);
  }
  console.log(`   ✅ ${productosGuardados.length} productos listos`);

  // ============================================================
  // 7. VEHÍCULOS DE CLIENTES (asociados a clientes)
  // ============================================================
  console.log('\n🚙 Creando vehículos de clientes...');
  
  const vehiculosData = [
    { patente: 'ABCD12', marca: 'Toyota', modelo: 'Yaris', anio: 2018, kilometraje: 45000, cliente: clientesGuardados[0] },
    { patente: 'EFGH34', marca: 'Toyota', modelo: 'Corolla', anio: 2020, kilometraje: 28000, cliente: clientesGuardados[0] },
    { patente: 'IJKL56', marca: 'Nissan', modelo: 'V16', anio: 2015, kilometraje: 120000, cliente: clientesGuardados[1] },
    { patente: 'MNOP78', marca: 'Chevrolet', modelo: 'Spark', anio: 2017, kilometraje: 68000, cliente: clientesGuardados[2] },
    { patente: 'QRST90', marca: 'Hyundai', modelo: 'Accent', anio: 2019, kilometraje: 35000, cliente: clientesGuardados[3] },
    { patente: 'UVWX11', marca: 'Kia', modelo: 'Morning', anio: 2016, kilometraje: 92000, cliente: clientesGuardados[4] },
    { patente: 'FLOT01', marca: 'Toyota', modelo: 'Yaris', anio: 2020, kilometraje: 55000, cliente: clientesGuardados[5] },
    { patente: 'FLOT02', marca: 'Nissan', modelo: 'Versa', anio: 2020, kilometraje: 48000, cliente: clientesGuardados[5] },
    { patente: 'FLOT03', marca: 'Hyundai', modelo: 'Accent', anio: 2020, kilometraje: 52000, cliente: clientesGuardados[5] },
  ];

  const vehiculosGuardados: Vehicle[] = [];
  for (const v of vehiculosData) {
    let veh = await vehicleRepo.findOneBy({ patente: v.patente });
    if (!veh) {
      veh = await vehicleRepo.save(v);
    }
    vehiculosGuardados.push(veh);
  }
  console.log(`   ✅ ${vehiculosGuardados.length} vehículos listos`);

  // ============================================================
  // 8. COMPRAS A PROVEEDORES (Llenar stock)
  // ============================================================
  console.log('\n🧾 Registrando compras a proveedores...');

  // Función helper para crear una compra
  const crearCompra = async (
    proveedor: Provider,
    numeroFactura: string,
    tipoDoc: 'FACTURA' | 'INFORMAL',
    items: { producto: Product; cantidad: number; precioCosto: number }[],
  ) => {
    const purchase = new Purchase();
    purchase.numero_factura = numeroFactura;
    purchase.proveedor = proveedor;
    purchase.createdByName = 'María Aguilera';
    purchase.detalles = [];

    let sumaTotal = 0;
    for (const item of items) {
      // Actualizar stock del producto
      item.producto.stock_actual += item.cantidad;
      await prodRepo.save(item.producto);

      const totalFila = item.cantidad * item.precioCosto;
      sumaTotal += totalFila;

      const detail = new PurchaseDetail();
      detail.producto = item.producto;
      detail.cantidad = item.cantidad;
      detail.precio_costo_unitario = item.precioCosto;
      detail.total_fila = totalFila;
      detail.compra = purchase;
      purchase.detalles.push(detail);
    }

    if (tipoDoc === 'FACTURA') {
      purchase.monto_neto = sumaTotal;
      purchase.monto_iva = Math.round(sumaTotal * 0.19);
      purchase.monto_total = purchase.monto_neto + purchase.monto_iva;
    } else {
      purchase.monto_neto = sumaTotal;
      purchase.monto_iva = 0;
      purchase.monto_total = sumaTotal;
    }

    await purchaseRepo.save(purchase);
    for (const det of purchase.detalles) {
      await purchaseDetailRepo.save(det);
    }
    return purchase;
  };

  // Compra 1: Pastillas y discos Toyota
  await crearCompra(proveedoresGuardados[0], 'F-2025-001', 'FACTURA', [
    { producto: productosGuardados[0], cantidad: 20, precioCosto: 15000 }, // Pastillas Toyota
    { producto: productosGuardados[1], cantidad: 15, precioCosto: 12000 }, // Pastillas traseras
    { producto: productosGuardados[6], cantidad: 10, precioCosto: 28000 }, // Discos Yaris
    { producto: productosGuardados[7], cantidad: 8, precioCosto: 32000 },  // Discos Corolla
  ]);
  console.log('   ✅ Compra F-2025-001 registrada (Repuestos del Sur)');

  // Compra 2: Pastillas Nissan y Chevrolet
  await crearCompra(proveedoresGuardados[1], 'F-2025-002', 'FACTURA', [
    { producto: productosGuardados[2], cantidad: 15, precioCosto: 14000 }, // Pastillas Nissan
    { producto: productosGuardados[3], cantidad: 12, precioCosto: 11000 }, // Pastillas Chevrolet
    { producto: productosGuardados[8], cantidad: 6, precioCosto: 22000 },  // Discos Nissan
    { producto: productosGuardados[9], cantidad: 6, precioCosto: 18000 },  // Discos Chevrolet
  ]);
  console.log('   ✅ Compra F-2025-002 registrada (Frenos Chile)');

  // Compra 3: Líquidos y mangueras
  await crearCompra(proveedoresGuardados[2], 'F-2025-003', 'FACTURA', [
    { producto: productosGuardados[14], cantidad: 30, precioCosto: 4000 },  // DOT4 500ml
    { producto: productosGuardados[15], cantidad: 20, precioCosto: 6000 },  // DOT4 1L
    { producto: productosGuardados[16], cantidad: 20, precioCosto: 3000 },  // DOT3
    { producto: productosGuardados[19], cantidad: 15, precioCosto: 8000 },  // Mangueras
  ]);
  console.log('   ✅ Compra F-2025-003 registrada (Distribuidora Bosch)');

  // Compra 4: Tambores, balatas y cilindros
  await crearCompra(proveedoresGuardados[3], 'B-2025-001', 'INFORMAL', [
    { producto: productosGuardados[10], cantidad: 8, precioCosto: 20000 },  // Tambor Toyota
    { producto: productosGuardados[11], cantidad: 6, precioCosto: 18000 },  // Tambor Nissan
    { producto: productosGuardados[12], cantidad: 10, precioCosto: 9000 },  // Balatas Toyota
    { producto: productosGuardados[13], cantidad: 8, precioCosto: 8000 },   // Balatas Nissan
  ]);
  console.log('   ✅ Compra B-2025-001 registrada (AutoPartes Santiago - INFORMAL)');

  // Compra 5: Hyundai y Kia
  await crearCompra(proveedoresGuardados[4], 'F-2025-004', 'FACTURA', [
    { producto: productosGuardados[4], cantidad: 12, precioCosto: 14500 }, // Pastillas Hyundai
    { producto: productosGuardados[5], cantidad: 10, precioCosto: 13500 }, // Pastillas Kia
    { producto: productosGuardados[17], cantidad: 4, precioCosto: 50000 }, // Cilindro maestro
    { producto: productosGuardados[18], cantidad: 8, precioCosto: 14000 }, // Bombines
  ]);
  console.log('   ✅ Compra F-2025-004 registrada (Importadora Brembo)');

  // ============================================================
  // 9. ÓRDENES DE TRABAJO
  // ============================================================
  console.log('\n📋 Creando órdenes de trabajo...');

  const crearOrden = async (
    numeroOrden: number,
    cliente: Client,
    vehiculo: Vehicle,
    realizadoPor: string,
    items: { servicio: string; descripcion: string; precio: number; producto?: Product }[],
  ) => {
    // Verificar si ya existe
    const existente = await workOrderRepo.findOneBy({ numero_orden_papel: numeroOrden });
    if (existente) return existente;

    const order = new WorkOrder();
    order.numero_orden_papel = numeroOrden;
    order.cliente = cliente;
    order.patente_vehiculo = vehiculo.patente;
    order.kilometraje = vehiculo.kilometraje;
    order.realizado_por = realizadoPor;
    order.revisado_por = 'María Aguilera';
    order.estado = 'FINALIZADA';
    order.createdByName = 'Pedro Mecánico';
    order.detalles = [];

    let total = 0;
    for (const item of items) {
      const detail = new WorkOrderDetail();
      detail.servicio_nombre = item.servicio;
      detail.descripcion = item.descripcion;
      detail.precio = item.precio;
      detail.workOrder = order;

      if (item.producto) {
        // Descontar stock
        item.producto.stock_actual -= 1;
        await prodRepo.save(item.producto);
        detail.producto = item.producto;
      }

      order.detalles.push(detail);
      total += item.precio;
    }

    order.total_cobrado = total;
    await workOrderRepo.save(order);
    for (const det of order.detalles) {
      await workOrderDetailRepo.save(det);
    }
    return order;
  };

  // Orden 1: Cambio de pastillas completo
  await crearOrden(1001, clientesGuardados[0], vehiculosGuardados[0], 'Trabajador Taller', [
    { servicio: 'Cambio Pastillas', descripcion: 'Cambio pastillas delanteras cerámicas Bosch', precio: 45000, producto: productosGuardados[0] },
    { servicio: 'Revisión', descripcion: 'Revisión sistema de frenos completo', precio: 15000 },
  ]);
  console.log('   ✅ Orden #1001 creada (Toyota Yaris ABCD12)');

  // Orden 2: Cambio de discos y pastillas
  await crearOrden(1002, clientesGuardados[1], vehiculosGuardados[2], 'Trabajador Taller', [
    { servicio: 'Cambio Pastillas', descripcion: 'Pastillas delanteras Brembo', precio: 42000, producto: productosGuardados[2] },
    { servicio: 'Cambio Discos', descripcion: 'Disco sólido delantero Fremax', precio: 65000, producto: productosGuardados[8] },
    { servicio: 'Sangrado', descripcion: 'Sangrado sistema de frenos', precio: 20000 },
  ]);
  console.log('   ✅ Orden #1002 creada (Nissan V16 IJKL56)');

  // Orden 3: Rectificado de tambores
  await crearOrden(1003, clientesGuardados[2], vehiculosGuardados[3], 'Trabajador Taller', [
    { servicio: 'Rectificado', descripcion: 'Rectificado de tambores traseros', precio: 35000 },
    { servicio: 'Cambio Balatas', descripcion: 'Balatas traseras nuevas', precio: 28000 },
    { servicio: 'Cambio Liquido', descripcion: 'Cambio líquido DOT4', precio: 18000, producto: productosGuardados[14] },
  ]);
  console.log('   ✅ Orden #1003 creada (Chevrolet Spark MNOP78)');

  // Orden 4: Servicio completo Hyundai
  await crearOrden(1004, clientesGuardados[3], vehiculosGuardados[4], 'Trabajador Taller', [
    { servicio: 'Cambio Pastillas', descripcion: 'Pastillas delanteras Bosch cerámicas', precio: 45000, producto: productosGuardados[4] },
    { servicio: 'Revisión', descripcion: 'Revisión general sistema de frenos', precio: 15000 },
    { servicio: 'Sangrado', descripcion: 'Sangrado y cambio de líquido', precio: 22000, producto: productosGuardados[15] },
  ]);
  console.log('   ✅ Orden #1004 creada (Hyundai Accent QRST90)');

  // Orden 5: Flota - Vehículo 1
  await crearOrden(1005, clientesGuardados[5], vehiculosGuardados[6], 'Trabajador Taller', [
    { servicio: 'Cambio Pastillas', descripcion: 'Pastillas delanteras Toyota', precio: 45000, producto: productosGuardados[0] },
    { servicio: 'Cambio Liquido', descripcion: 'Líquido DOT4 500ml', precio: 15000, producto: productosGuardados[14] },
  ]);
  console.log('   ✅ Orden #1005 creada (Flota FLOT01)');

  // ============================================================
  // 10. VENTAS DE MOSTRADOR
  // ============================================================
  console.log('\n💰 Registrando ventas de mostrador...');

  const crearVentaMostrador = async (
    tipo: MovementType,
    vendedor: string,
    comentario: string,
    items: { producto: Product; cantidad: number; precioVenta?: number }[],
  ) => {
    const sale = new CounterSale();
    sale.tipo_movimiento = tipo;
    sale.vendedor = vendedor;
    sale.comentario = comentario;
    sale.createdByName = vendedor;
    sale.detalles = [];

    let totalVenta = 0;
    let costoPerdida = 0;

    for (const item of items) {
      // Descontar stock
      item.producto.stock_actual -= item.cantidad;
      await prodRepo.save(item.producto);

      const detail = new CounterSaleDetail();
      detail.cantidad = item.cantidad;
      detail.producto = item.producto;
      detail.costo_producto = item.producto.precio_venta;
      detail.counterSale = sale;

      if (tipo === MovementType.VENTA && item.precioVenta) {
        detail.precio_venta_unitario = item.precioVenta;
        detail.total_fila = item.cantidad * item.precioVenta;
        totalVenta += detail.total_fila;
      } else if (tipo === MovementType.PERDIDA) {
        detail.precio_venta_unitario = 0;
        detail.total_fila = 0;
        costoPerdida += item.cantidad * item.producto.precio_venta;
      } else {
        detail.precio_venta_unitario = 0;
        detail.total_fila = 0;
      }

      sale.detalles.push(detail);
    }

    sale.total_venta = totalVenta;
    sale.costo_perdida = costoPerdida;

    await counterSaleRepo.save(sale);
    for (const det of sale.detalles) {
      await counterSaleDetailRepo.save(det);
    }
    return sale;
  };

  // Venta 1: Cliente compra pastillas sin instalación
  await crearVentaMostrador(MovementType.VENTA, 'María Aguilera', 'Cliente compró pastillas para instalar en otro taller', [
    { producto: productosGuardados[0], cantidad: 1, precioVenta: 28000 },
  ]);
  console.log('   ✅ Venta mostrador registrada (Pastillas Toyota)');

  // Venta 2: Cliente compra líquido de frenos
  await crearVentaMostrador(MovementType.VENTA, 'Trabajador Taller', 'Venta de líquido DOT4 para cliente', [
    { producto: productosGuardados[14], cantidad: 2, precioVenta: 8000 },
    { producto: productosGuardados[19], cantidad: 1, precioVenta: 15000 },
  ]);
  console.log('   ✅ Venta mostrador registrada (Líquido + Manguera)');

  // Pérdida: Producto dañado
  await crearVentaMostrador(MovementType.PERDIDA, 'Trabajador Taller', 'Disco rayado durante manipulación', [
    { producto: productosGuardados[6], cantidad: 1 },
  ]);
  console.log('   ✅ Pérdida registrada (Disco dañado)');

  // Uso interno: Líquido para herramientas
  await crearVentaMostrador(MovementType.USO_INTERNO, 'Trabajador Taller', 'Líquido usado para limpiar sistema de sangrado', [
    { producto: productosGuardados[16], cantidad: 1 },
  ]);
  console.log('   ✅ Uso interno registrado (DOT3 para limpieza)');

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log('\n========================================');
  console.log('🏁 SEED COMPLETO FINALIZADO');
  console.log('========================================');
  console.log('📊 Datos creados:');
  console.log(`   👤 ${usuarios.length} Usuarios (1 ADMIN + 1 WORKER)`);
  console.log(`   📂 ${catsGuardadas.length} Categorías`);
  console.log(`   🚗 ${modelosGuardados.length} Modelos de vehículos`);
  console.log(`   🏭 ${proveedoresGuardados.length} Proveedores`);
  console.log(`   👥 ${clientesGuardados.length} Clientes`);
  console.log(`   📦 ${productosGuardados.length} Productos`);
  console.log(`   🚙 ${vehiculosGuardados.length} Vehículos de clientes`);
  console.log('   🧾 5 Compras a proveedores');
  console.log('   📋 5 Órdenes de trabajo');
  console.log('   💰 4 Movimientos de mostrador');
  console.log('========================================');
  console.log('\n🔐 CREDENCIALES DE ACCESO:');
  console.log('   ADMIN:  RUT 111111111 | Clave: admin123');
  console.log('   WORKER: RUT 222222222 | Clave: taller123');
  console.log('========================================\n');

  await dataSource.destroy();
}

seed().catch((e) => {
  console.error('❌ Error en seed:', e);
  process.exit(1);
});