import {
  Body,
  Controller,
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
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { CreateCommitteeUseCase } from 'src/application/use-cases/committee/create-management-committee.use-case';
import { FindCommitteeByIdUseCase } from 'src/application/use-cases/committee/find-management-committee-by-id.use-case';
import { FindAllCommitteesUseCase } from 'src/application/use-cases/committee/find-all-management-committees.use-case';
import { CommitteeResponseDto } from 'src/application/dtos/committee/committee-response.dto';
import { CreateUpdateCommitteeDto } from 'src/application/dtos/committee/create-update-committee.dto';
import { UpdateCommitteeUseCase } from 'src/application/use-cases/committee/update-management-committee.use-case';

@ApiTags('committees')
@Controller('committees')
export class CommitteeController {
  constructor(
    private readonly createUseCase: CreateCommitteeUseCase,
    private readonly findByIdUseCase: FindCommitteeByIdUseCase,
    private readonly findAllUseCase: FindAllCommitteesUseCase,
    private readonly updateUseCase: UpdateCommitteeUseCase,
  ) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo comité de gestión' })
  @ApiResponse({ status: 201, type: CommitteeResponseDto })
  async create(
    @Body() dto: CreateUpdateCommitteeDto,
  ): Promise<CommitteeResponseDto> {
    return await this.createUseCase.execute(dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['admin'])
  @ApiOperation({ summary: 'Listar todos los comités de gestión' })
  @ApiResponse({ status: 200, type: [CommitteeResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommitteeResponseDto[]> {
    return await this.findAllUseCase.execute(Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener comité de gestión por ID' })
  @ApiResponse({ status: 200, type: CommitteeResponseDto })
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<CommitteeResponseDto> {
    return await this.findByIdUseCase.execute(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Actualizar un nuevo comité de gestión' })
  @ApiResponse({ status: 201, type: CommitteeResponseDto })
  async update(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: CreateUpdateCommitteeDto,
  ): Promise<CommitteeResponseDto> {
    return await this.updateUseCase.execute(id, dto);
  }
}
