import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateManagementCommitteeDto } from 'src/application/dtos/management-committee/create-management-committee.dto';
import { ManagementCommitteeResponseDto } from 'src/application/dtos/management-committee/management-committee-response.dto';
import { CreateManagementCommitteeUseCase } from 'src/application/use-cases/management-committee/create-management-committee.use-case';
import { FindManagementCommitteeByIdUseCase } from 'src/application/use-cases/management-committee/find-management-committee-by-id.use-case';
import { FindAllManagementCommitteesUseCase } from 'src/application/use-cases/management-committee/find-all-management-committees.use-case';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { FindAllManagementCommitteesByUserUseCase } from 'src/application/use-cases/management-committee/find-all-management-committees-by-user.use-case';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@ApiTags('management-committees')
@Controller('management-committees')
export class ManagementCommitteeController {
  constructor(
    private readonly createUseCase: CreateManagementCommitteeUseCase,
    private readonly findByIdUseCase: FindManagementCommitteeByIdUseCase,
    private readonly findAllUseCase: FindAllManagementCommitteesUseCase,
    private readonly findAllByUserUseCase: FindAllManagementCommitteesByUserUseCase,
  ) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo comité de gestión' })
  @ApiResponse({ status: 201, type: ManagementCommitteeResponseDto })
  async create(
    @Req() req,
    @Body() dto: CreateManagementCommitteeDto,
  ): Promise<ManagementCommitteeResponseDto> {
    const userId = req.user.sub;
    return await this.createUseCase.execute(userId, dto);
  }

  @Get('by-user')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Listar todos los comités de gestión' })
  @ApiResponse({ status: 200, type: [ManagementCommitteeResponseDto] })
  async findAllByUser(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<ManagementCommitteeResponseDto[]> {
    return await this.findAllByUserUseCase.execute(
      Number(limit),
      Number(offset),
    );
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['admin'])
  @ApiOperation({ summary: 'Listar todos los comités de gestión' })
  @ApiResponse({ status: 200, type: [ManagementCommitteeResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<ManagementCommitteeResponseDto[]> {
    return await this.findAllUseCase.execute(Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener comité de gestión por ID' })
  @ApiResponse({ status: 200, type: ManagementCommitteeResponseDto })
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<ManagementCommitteeResponseDto> {
    return await this.findByIdUseCase.execute(id);
  }
}
