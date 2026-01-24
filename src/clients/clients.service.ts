import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private dataSource: DataSource) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.dataSource.manager.create(Client, createClientDto);
    return await this.dataSource.manager.save(client);
  }

  async findAll(): Promise<Client[]> {
    return await this.dataSource.manager.find(Client);
  }
}
