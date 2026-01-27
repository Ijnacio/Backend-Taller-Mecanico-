import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    // Normalizar patente a mayúsculas sin guiones
    const patenteNormalizada = createVehicleDto.patente
      .replace(/-/g, '')
      .toUpperCase();

    // Verificar si ya existe un vehículo con esa patente
    const existing = await this.vehicleRepository.findOne({
      where: { patente: patenteNormalizada },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un vehículo con patente ${patenteNormalizada}`);
    }

    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      patente: patenteNormalizada,
    });
    return this.vehicleRepository.save(vehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }
    return vehicle;
  }

  async findByPatente(patente: string): Promise<Vehicle | null> {
    const patenteNormalizada = patente.replace(/-/g, '').toUpperCase();
    return this.vehicleRepository.findOne({
      where: { patente: patenteNormalizada },
    });
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    
    // Si viene patente, normalizarla
    if (updateVehicleDto.patente) {
      updateVehicleDto.patente = updateVehicleDto.patente.replace(/-/g, '').toUpperCase();
    }
    
    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.remove(vehicle);
  }
}
