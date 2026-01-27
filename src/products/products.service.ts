import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(VehicleModel)
    private readonly vehicleModelRepository: Repository<VehicleModel>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verificar si ya existe un producto con ese SKU
    const existing = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un producto con SKU ${createProductDto.sku}`);
    }

    const product = this.productRepository.create(createProductDto);

    // Si viene categoriaId, buscar y asignar la categoría
    if (createProductDto.categoriaId) {
      const categoria = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoriaId },
      });
      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${createProductDto.categoriaId} no encontrada`);
      }
      product.categoria = categoria;
    }

    // Si vienen modelosCompatiblesIds, buscar y asignar
    if (createProductDto.modelosCompatiblesIds && createProductDto.modelosCompatiblesIds.length > 0) {
      const modelos = await this.vehicleModelRepository.find({
        where: { id: In(createProductDto.modelosCompatiblesIds) },
      });
      if (modelos.length !== createProductDto.modelosCompatiblesIds.length) {
        throw new NotFoundException('Algunos modelos de vehículo no fueron encontrados');
      }
      product.modelosCompatibles = modelos;
    }

    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['categoria', 'modelosCompatibles'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['categoria', 'modelosCompatibles'],
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Si viene categoriaId, buscar y asignar la categoría
    if (updateProductDto.categoriaId) {
      const categoria = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoriaId },
      });
      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${updateProductDto.categoriaId} no encontrada`);
      }
      product.categoria = categoria;
    }

    // Si vienen modelosCompatiblesIds, actualizar la relación
    if (updateProductDto.modelosCompatiblesIds !== undefined) {
      if (updateProductDto.modelosCompatiblesIds.length > 0) {
        const modelos = await this.vehicleModelRepository.find({
          where: { id: In(updateProductDto.modelosCompatiblesIds) },
        });
        if (modelos.length !== updateProductDto.modelosCompatiblesIds.length) {
          throw new NotFoundException('Algunos modelos de vehículo no fueron encontrados');
        }
        product.modelosCompatibles = modelos;
      } else {
        product.modelosCompatibles = [];
      }
    }

    // Remover campos de relación del DTO antes de asignar
    const { categoriaId, modelosCompatiblesIds, ...rest } = updateProductDto;
    Object.assign(product, rest);
    
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
