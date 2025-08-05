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
import { CreateChildUseCase } from 'src/application/use-cases/child/create-child.use-case';
import { FindChildByIdUseCase } from 'src/application/use-cases/child/find-child-by-id.use-case';
import { FindAllChildrenUseCase } from 'src/application/use-cases/child/find-all-children.use-case';
import { UpdateChildUseCase } from 'src/application/use-cases/child/update-child.use-case';
import { DeleteChildUseCase } from 'src/application/use-cases/child/delete-child.use-case';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('children')
@Controller('children')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
export class ChildController {
  constructor(
    private readonly createChildUseCase: CreateChildUseCase,
    private readonly findChildByIdUseCase: FindChildByIdUseCase,
    private readonly findAllChildrenUseCase: FindAllChildrenUseCase,
    private readonly updateChildUseCase: UpdateChildUseCase,
    private readonly deleteChildUseCase: DeleteChildUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo niño' })
  @ApiResponse({ status: 201, type: ChildResponseDto })
  async create(@Body() dto: CreateChildDto): Promise<ChildResponseDto> {
    return this.createChildUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener niño por ID' })
  @ApiResponse({ status: 200, type: ChildResponseDto })
  async findById(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<ChildResponseDto> {
    return this.findChildByIdUseCase.execute(id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los niños' })
  @ApiResponse({ status: 200, type: [ChildResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<ChildResponseDto[]> {
    return this.findAllChildrenUseCase.execute(Number(limit), Number(offset));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un niño' })
  @ApiResponse({ status: 200, type: ChildResponseDto })
  async update(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateChildDto,
  ): Promise<ChildResponseDto> {
    return this.updateChildUseCase.execute(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un niño' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ValidateObjectIdPipe) id: string): Promise<void> {
    await this.deleteChildUseCase.execute(id);
  }
}
