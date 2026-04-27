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
import { CommitteeService } from 'src/application/services/committee.service';
import { CommitteeResponseDto } from 'src/application/dtos/committee/committee-response.dto';
import { CreateUpdateCommitteeDto } from 'src/application/dtos/committee/create-update-committee.dto';

@ApiTags('committees')
@Controller('committees')
export class CommitteeController {
  constructor(private readonly service: CommitteeService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo comité de gestión' })
  @ApiResponse({ status: 201, type: CommitteeResponseDto })
  async create(
    @Body() dto: CreateUpdateCommitteeDto,
  ): Promise<CommitteeResponseDto> {
    return await this.service.create(dto);
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
    return await this.service.findAll(Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener comité de gestión por ID' })
  @ApiResponse({ status: 200, type: CommitteeResponseDto })
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<CommitteeResponseDto> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Actualizar un comité de gestión' })
  @ApiResponse({ status: 201, type: CommitteeResponseDto })
  async update(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: CreateUpdateCommitteeDto,
  ): Promise<CommitteeResponseDto> {
    return await this.service.update(id, dto);
  }
}
