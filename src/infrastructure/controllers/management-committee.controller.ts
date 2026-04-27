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
import { CreateManagementCommitteeForUserDto } from 'src/application/dtos/management-committee/create-management-committee-for-user.dto';
import { ManagementCommitteeResponseDto } from 'src/application/dtos/management-committee/management-committee-response.dto';
import { ManagementCommitteeService } from 'src/application/services/management-committee.service';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@ApiTags('management-committees')
@Controller('management-committees')
export class ManagementCommitteeController {
  constructor(private readonly service: ManagementCommitteeService) {}

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
    return await this.service.create(userId, dto);
  }

  @Get('by-user')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Listar todos los comités de gestión por usuarios' })
  @ApiResponse({ status: 200, type: [ManagementCommitteeResponseDto] })
  async findAllByUser(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<ManagementCommitteeResponseDto[]> {
    return await this.service.findAllByCurrentUser(
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
    return await this.service.findAll(Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener comité de gestión por ID' })
  @ApiResponse({ status: 200, type: ManagementCommitteeResponseDto })
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<ManagementCommitteeResponseDto> {
    return await this.service.findById(id);
  }

  @Post('for-user')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Roles(['admin'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar un comité de gestión al usuario' })
  @ApiResponse({ status: 201, type: ManagementCommitteeResponseDto })
  async createForUser(
    @Body() dto: CreateManagementCommitteeForUserDto,
  ): Promise<ManagementCommitteeResponseDto> {
    return await this.service.createForUser(dto);
  }
}
