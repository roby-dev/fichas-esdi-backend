import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCommunityHallDto } from 'src/application/dtos/community-hall/create-community-hall.dto';
import { CommunityHallResponseDto } from 'src/application/dtos/community-hall/community-hall-response.dto';
import { CreateCommunityHallUseCase } from 'src/application/use-cases/community-hall/create-community-hall.use-case';
import { FindAllCommunityHallsUseCase } from 'src/application/use-cases/community-hall/find-all-community-halls.use-case';
import { FindCommunityHallByIdUseCase } from 'src/application/use-cases/community-hall/find-community-hall-by-id.use-case';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';

@ApiTags('community-halls')
@Controller('community-halls')
export class CommunityHallController {
  constructor(
    private readonly createCommunityHallUseCase: CreateCommunityHallUseCase,
    private readonly findAllCommunityHallsUseCase: FindAllCommunityHallsUseCase,
    private readonly findCommunityHallByIdUseCase: FindCommunityHallByIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo local comunal' })
  @ApiResponse({ status: 201, type: CommunityHallResponseDto })
  async create(
    @Body() createDto: CreateCommunityHallDto,
  ): Promise<CommunityHallResponseDto> {
    return await this.createCommunityHallUseCase.execute(createDto);
  }

  @Get()
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
  @ApiOperation({ summary: 'Obtener local comunal por ID' })
  @ApiResponse({ status: 200, type: CommunityHallResponseDto })
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<CommunityHallResponseDto> {
    return await this.findCommunityHallByIdUseCase.execute(id);
  }
}
