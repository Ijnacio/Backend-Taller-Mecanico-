import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { VehicleModel } from './entities/vehicle-model.entity';

@Injectable()
export class VehicleModelsService {
  constructor(
    @InjectRepository(VehicleModel)
    private readonly vehicleModelRepository: Repository<VehicleModel>,
  ) {}

  async create(createVehicleModelDto: CreateVehicleModelDto): Promise<VehicleModel> {
    // Verificar si ya existe ese modelo exacto
    const existing = await this.vehicleModelRepository.findOne({
      where: {
        marca: createVehicleModelDto.marca,
        modelo: createVehicleModelDto.modelo,
        anio: createVehicleModelDto.anio || undefined,
      },
    });
    
    if (existing) {
      throw new ConflictException(
        `Ya existe el modelo ${createVehicleModelDto.marca} ${createVehicleModelDto.modelo} ${createVehicleModelDto.anio || ''}`.trim()
      );
    }

    const vehicleModel = this.vehicleModelRepository.create(createVehicleModelDto);
    return this.vehicleModelRepository.save(vehicleModel);
  }

  async findAll(): Promise<VehicleModel[]> {
    return this.vehicleModelRepository.find({
      order: { marca: 'ASC', modelo: 'ASC', anio: 'DESC' },
    });
  }

  async findOne(id: string): Promise<VehicleModel> {
    const vehicleModel = await this.vehicleModelRepository.findOne({
      where: { id },
      relations: ['productos'],
    });
    if (!vehicleModel) {
      throw new NotFoundException(`Modelo de vehículo con ID ${id} no encontrado`);
    }
    return vehicleModel;
  }

  /**
   * Buscar modelos por texto (para autocompletado en frontend)
   */
  async search(query: string): Promise<VehicleModel[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return this.vehicleModelRepository.find({
      where: [
        { marca: Like(`%${query}%`) },
        { modelo: Like(`%${query}%`) },
      ],
      order: { marca: 'ASC', modelo: 'ASC' },
      take: 20,
    });
  }

  /**
   * Obtener todas las marcas únicas (para selector)
   */
  async getMarcas(): Promise<string[]> {
    const result = await this.vehicleModelRepository
      .createQueryBuilder('vm')
      .select('DISTINCT vm.marca', 'marca')
      .orderBy('vm.marca', 'ASC')
      .getRawMany();
    
    return result.map(r => r.marca);
  }

  /**
   * Obtener modelos de una marca específica (para selector cascada)
   */
  async getModelosByMarca(marca: string): Promise<string[]> {
    const result = await this.vehicleModelRepository
      .createQueryBuilder('vm')
      .select('DISTINCT vm.modelo', 'modelo')
      .where('vm.marca = :marca', { marca })
      .orderBy('vm.modelo', 'ASC')
      .getRawMany();
    
    return result.map(r => r.modelo);
  }

  async update(id: string, updateVehicleModelDto: UpdateVehicleModelDto): Promise<VehicleModel> {
    const vehicleModel = await this.findOne(id);
    Object.assign(vehicleModel, updateVehicleModelDto);
    return this.vehicleModelRepository.save(vehicleModel);
  }

  async remove(id: string): Promise<void> {
    const vehicleModel = await this.findOne(id);
    await this.vehicleModelRepository.remove(vehicleModel);
  }
}
