import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { Client } from '../clients/entities/client.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
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

    // Si viene clienteId, buscar y asignar el cliente
    if (createVehicleDto.clienteId) {
      const cliente = await this.clientRepository.findOne({
        where: { id: createVehicleDto.clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${createVehicleDto.clienteId} no encontrado`);
      }
      vehicle.cliente = cliente;
    }

    return this.vehicleRepository.save(vehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      relations: ['cliente'],
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['cliente'],
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
      relations: ['cliente'],
    });
  }

  async findByClienteId(clienteId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { cliente: { id: clienteId } },
      relations: ['cliente'],
    });
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    
    // Si viene patente, normalizarla
    if (updateVehicleDto.patente) {
      updateVehicleDto.patente = updateVehicleDto.patente.replace(/-/g, '').toUpperCase();
    }

    // Si viene clienteId, buscar y asignar el cliente
    if (updateVehicleDto.clienteId) {
      const cliente = await this.clientRepository.findOne({
        where: { id: updateVehicleDto.clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${updateVehicleDto.clienteId} no encontrado`);
      }
      vehicle.cliente = cliente;
    }

    // Remover clienteId del DTO antes de asignar
    const { clienteId, ...rest } = updateVehicleDto;
    Object.assign(vehicle, rest);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.remove(vehicle);
  }
}
