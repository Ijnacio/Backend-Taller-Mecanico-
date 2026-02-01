import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El SKU ya existe' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos (excluye eliminados)' })
  @ApiQuery({ name: 'categoriaId', required: false, description: 'Filtrar por ID de categoría' })
  @ApiResponse({ status: 200, description: 'Lista de productos activos' })
  findAll(@Query('categoriaId') categoriaId?: string) {
    return this.productsService.findAll(categoriaId);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Obtener productos eliminados (soft delete)' })
  @ApiResponse({ status: 200, description: 'Lista de productos eliminados' })
  findDeleted() {
    return this.productsService.findDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurar un producto eliminado' })
  @ApiResponse({ status: 200, description: 'Producto restaurado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 409, description: 'El producto no está eliminado' })
  restore(@Param('id') id: string) {
    return this.productsService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto (soft delete - se puede restaurar)' })
  @ApiResponse({ status: 200, description: 'Producto eliminado (soft delete)' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
