import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VehicleModelsService } from './vehicle-models.service';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { VehicleModel } from './entities/vehicle-model.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Vehicle Models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicle-models')
export class VehicleModelsController {
  constructor(private readonly vehicleModelsService: VehicleModelsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo modelo de vehículo' })
  @ApiResponse({
    status: 201,
    description: 'Modelo de vehículo creado exitosamente',
    type: VehicleModel,
  })
  @ApiResponse({ status: 409, description: 'El modelo ya existe' })
  create(@Body() createVehicleModelDto: CreateVehicleModelDto): Promise<VehicleModel> {
    return this.vehicleModelsService.create(createVehicleModelDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  @ApiOperation({ summary: 'Obtener todos los modelos de vehículos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de modelos de vehículos',
    type: [VehicleModel],
  })
  findAll(): Promise<VehicleModel[]> {
    return this.vehicleModelsService.findAll();
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  @ApiOperation({ summary: 'Buscar modelos por texto (autocompletado)' })
  @ApiQuery({ name: 'q', description: 'Texto de búsqueda (mínimo 2 caracteres)' })
  @ApiResponse({
    status: 200,
    description: 'Modelos encontrados',
    type: [VehicleModel],
  })
  search(@Query('q') query: string): Promise<VehicleModel[]> {
    return this.vehicleModelsService.search(query);
  }

  @Get('marcas')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  @ApiOperation({ summary: 'Obtener lista de marcas únicas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de marcas',
    type: [String],
  })
  getMarcas(): Promise<string[]> {
    return this.vehicleModelsService.getMarcas();
  }

  @Get('marcas/:marca/modelos')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  @ApiOperation({ summary: 'Obtener modelos de una marca específica' })
  @ApiParam({ name: 'marca', description: 'Nombre de la marca' })
  @ApiResponse({
    status: 200,
    description: 'Lista de modelos de la marca',
    type: [String],
  })
  getModelosByMarca(@Param('marca') marca: string): Promise<string[]> {
    return this.vehicleModelsService.getModelosByMarca(marca);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  @ApiOperation({ summary: 'Obtener un modelo de vehículo por ID' })
  @ApiParam({ name: 'id', description: 'UUID del modelo' })
  @ApiResponse({
    status: 200,
    description: 'Modelo encontrado',
    type: VehicleModel,
  })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleModel> {
    return this.vehicleModelsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un modelo de vehículo' })
  @ApiParam({ name: 'id', description: 'UUID del modelo' })
  @ApiResponse({
    status: 200,
    description: 'Modelo actualizado',
    type: VehicleModel,
  })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleModelDto: UpdateVehicleModelDto,
  ): Promise<VehicleModel> {
    return this.vehicleModelsService.update(id, updateVehicleModelDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un modelo de vehículo' })
  @ApiParam({ name: 'id', description: 'UUID del modelo' })
  @ApiResponse({ status: 200, description: 'Modelo eliminado' })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vehicleModelsService.remove(id);
  }
}
