import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateChildDto } from 'src/application/dtos/child/create-child.dto';
import { UpdateChildDto } from 'src/application/dtos/child/update-child.dto';
import { ChildResponseDto } from 'src/application/dtos/child/child-response.dto';
import { UserWithChildrenDto } from 'src/application/dtos/child/user-with-children.dto';
import { ChildService } from 'src/application/services/child.service';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('children')
@Controller('children')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
export class ChildController {
  constructor(private readonly service: ChildService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo niño' })
  @ApiResponse({ status: 201, type: ChildResponseDto })
  async create(@Body() dto: CreateChildDto): Promise<ChildResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los niños' })
  @ApiResponse({ status: 200, type: [ChildResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<ChildResponseDto[]> {
    return this.service.findAllByCurrentUser(Number(limit), Number(offset));
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Obtener todos los niños del usuario autenticado' })
  @ApiResponse({ status: 200, type: [ChildResponseDto] })
  async findAllByUser(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<ChildResponseDto[]> {
    return this.service.findAllByCurrentUser(Number(limit), Number(offset));
  }

  @Get('grouped-by-user')
  @ApiOperation({ summary: 'Obtener todos los usuarios con sus niños registrados' })
  @ApiResponse({ status: 200, type: [UserWithChildrenDto] })
  async findGroupedByUser(): Promise<UserWithChildrenDto[]> {
    return this.service.findAllGroupedByUser();
  }

  @Get('by-committee/:id')
  @ApiOperation({ summary: 'Obtener todos los niños por ID de comité' })
  @ApiResponse({ status: 200, type: [ChildResponseDto] })
  async findAllByCommittee(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<ChildResponseDto[]> {
    return this.service.findAllByCommittee(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener niño por ID' })
  @ApiResponse({ status: 200, type: ChildResponseDto })
  async findById(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<ChildResponseDto> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un niño' })
  @ApiResponse({ status: 200, type: ChildResponseDto })
  async update(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateChildDto,
  ): Promise<ChildResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un niño' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ValidateObjectIdPipe) id: string): Promise<void> {
    await this.service.delete(id);
  }
}
