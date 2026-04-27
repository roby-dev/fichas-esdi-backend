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
import { CommunityHallService } from 'src/application/services/community-hall.service';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('community-halls')
@Controller('community-halls')
export class CommunityHallController {
  constructor(private readonly service: CommunityHallService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo local comunal' })
  @ApiResponse({ status: 201, type: CommunityHallResponseDto })
  async create(
    @Body() createDto: CreateCommunityHallDto,
  ): Promise<CommunityHallResponseDto> {
    return await this.service.create(createDto);
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
    return await this.service.findAll(Number(limit), Number(offset));
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener local comunal por ID' })
  @ApiResponse({ status: 200, type: CommunityHallResponseDto })
  async findOne(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<CommunityHallResponseDto> {
    return await this.service.findById(id);
  }

  @Get('by-committee/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener todos los locales comunales por commite id' })
  @ApiResponse({ status: 200, type: [CommunityHallResponseDto] })
  async findAllByCommittee(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommunityHallResponseDto[]> {
    return await this.service.findAllByCommitteeId(
      id,
      Number(limit),
      Number(offset),
    );
  }
}
