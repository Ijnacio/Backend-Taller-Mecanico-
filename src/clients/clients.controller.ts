import { Controller, Get, Post, Body, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) { }

  /**
   * POST /api/clients
   * Crear nuevo cliente (ADMIN puede crear)
   */
  @Post()
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Ya existe cliente con ese RUT o email' })
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

  /**
   * GET /api/clients/by-rut/:rut
   * Buscar cliente por RUT (normaliza automáticamente)
   * Útil para el frontend al crear órdenes de trabajo
   */
  @Get('by-rut/:rut')
  @ApiOperation({
    summary: 'Buscar cliente por RUT (incluye historial de órdenes)',
  })
  @ApiParam({
    name: 'rut',
    description: 'RUT del cliente (acepta formato con puntos y guión)',
    example: '12.345.678-9',
  })
  @ApiResponse({ status: 200, description: 'Cliente encontrado con sus órdenes' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findByRut(@Param('rut') rut: string) {
    const client = await this.clientsService.findByRut(rut);
    if (!client) {
      throw new NotFoundException(`No se encontró cliente con RUT ${rut}`);
    }
    return client;
  }

  /**
   * GET /api/clients/:id
   * Obtener cliente por ID (incluye órdenes)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener cliente por ID (incluye historial de órdenes)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del cliente',
  })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(@Param('id') id: string) {
    const client = await this.clientsService.findOne(id);
    if (!client) {
      throw new NotFoundException(`No se encontró cliente con ID ${id}`);
    }
    return client;
  }
}

