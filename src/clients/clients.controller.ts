import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * POST /api/clients
   * Crear nuevo cliente (ADMIN puede crear)
   */
  @Post()
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  /**
   * GET /api/clients
   * Listar clientes (ADMIN y WORKER pueden ver, necesario para órdenes de trabajo)
   */
  @Get()
  @ApiOperation({
    summary: 'Listar clientes (ADMIN y WORKER ven solo datos básicos)',
  })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll() {
    return this.clientsService.findAll();
  }
}
