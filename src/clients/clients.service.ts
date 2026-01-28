import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private dataSource: DataSource) { }

  /**
   * Normaliza el RUT: quita puntos, guiones y convierte a mayúsculas
   * Ejemplo: "12.345.678-9" -> "123456789"
   */
  private normalizeRut(rut: string): string {
    return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
  }

  /**
   * Normaliza el email: lowercase y trim
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Normalizar RUT si viene
    if (createClientDto.rut) {
      const rutNormalizado = this.normalizeRut(createClientDto.rut);

      // Verificar si ya existe un cliente con ese RUT
      const existingByRut = await this.dataSource.manager.findOne(Client, {
        where: { rut: rutNormalizado },
      });
      if (existingByRut) {
        throw new ConflictException(`Ya existe un cliente con RUT ${createClientDto.rut}`);
      }

      createClientDto.rut = rutNormalizado;
    }

    // Normalizar email si viene
    if (createClientDto.email) {
      const emailNormalizado = this.normalizeEmail(createClientDto.email);

      // Verificar si ya existe un cliente con ese email
      const existingByEmail = await this.dataSource.manager.findOne(Client, {
        where: { email: emailNormalizado },
      });
      if (existingByEmail) {
        throw new ConflictException(`Ya existe un cliente con email ${createClientDto.email}`);
      }

      createClientDto.email = emailNormalizado;
    }

    const client = this.dataSource.manager.create(Client, createClientDto);
    return await this.dataSource.manager.save(client);
  }

  async findAll(): Promise<Client[]> {
    return await this.dataSource.manager.find(Client);
  }

  /**
   * Busca un cliente por RUT (normalizado)
   * @param rut RUT a buscar (puede venir con puntos y guión)
   * @returns Cliente encontrado o null
   */
  async findByRut(rut: string): Promise<Client | null> {
    const rutNormalizado = this.normalizeRut(rut);
    return await this.dataSource.manager.findOne(Client, {
      where: { rut: rutNormalizado },
      relations: ['ordenes'],
    });
  }

  /**
   * Busca un cliente por ID
   */
  async findOne(id: string): Promise<Client | null> {
    return await this.dataSource.manager.findOne(Client, {
      where: { id },
      relations: ['ordenes'],
    });
  }
}
