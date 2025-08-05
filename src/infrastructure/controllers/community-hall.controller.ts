import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateCommunityHallDto } from 'src/application/dtos/community-hall/create-community-hall.dto';
import { CommunityHallResponseDto } from 'src/application/dtos/community-hall/community-hall-response.dto';
import { CreateCommunityHallUseCase } from 'src/application/use-cases/community-hall/create-community-hall.use-case';
import { FindAllCommunityHallsUseCase } from 'src/application/use-cases/community-hall/find-all-community-halls.use-case';
import { FindCommunityHallByIdUseCase } from 'src/application/use-cases/community-hall/find-community-hall-by-id.use-case';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { FindAllCommunityHallsByCommitteeIdUseCase } from 'src/application/use-cases/community-hall/find-all-community-halls-by-committee-id.use-case';

@ApiTags('community-halls')
@Controller('community-halls')
export class CommunityHallController {
  constructor(
    private readonly createCommunityHallUseCase: CreateCommunityHallUseCase,
    private readonly findAllCommunityHallsUseCase: FindAllCommunityHallsUseCase,
    private readonly findCommunityHallByIdUseCase: FindCommunityHallByIdUseCase,
    private readonly findAllCommunityHallsByCommitteeIdUseCase: FindAllCommunityHallsByCommitteeIdUseCase,
  ) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo local comunal' })
  @ApiResponse({ status: 201, type: CommunityHallResponseDto })
  async create(
    @Body() createDto: CreateCommunityHallDto,
  ): Promise<CommunityHallResponseDto> {
    return await this.createCommunityHallUseCase.execute(createDto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener todos los locales comunales' })
  @ApiResponse({ status: 200, type: [CommunityHallResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommunityHallResponseDto[]> {
    return await this.findAllCommunityHallsUseCase.execute(
      Number(limit),
      Number(offset),
    );
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener local comunal por ID' })
  @ApiResponse({ status: 200, type: CommunityHallResponseDto })
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<CommunityHallResponseDto> {
    return await this.findCommunityHallByIdUseCase.execute(id);
  }

  @Get('by-committee/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener todos los locales comunales por commite id' })
  @ApiResponse({ status: 200, type: [CommunityHallResponseDto] })
  async findAllByUser(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommunityHallResponseDto[]> {
    return await this.findAllCommunityHallsByCommitteeIdUseCase.execute(id);
  }
}
