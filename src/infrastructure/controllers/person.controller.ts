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
import { CreatePersonDto } from 'src/application/dtos/person/create-person.dto';
import { PersonResponseDto } from 'src/application/dtos/person/person-response.dto';
import { PersonService } from 'src/application/services/person.service';

@ApiTags('persons')
@Controller('persons')
export class PersonController {
  constructor(private readonly service: PersonService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({ status: 201, type: PersonResponseDto })
  async create(
    @Body() createPersonDto: CreatePersonDto,
  ): Promise<PersonResponseDto> {
    return await this.service.create(createPersonDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get person by ID' })
  @ApiResponse({ status: 200, type: PersonResponseDto })
  async findOne(@Param('id') id: string): Promise<PersonResponseDto> {
    return await this.service.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all persons' })
  @ApiResponse({ status: 200, type: [PersonResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') _offset = '0',
  ): Promise<PersonResponseDto[]> {
    return [];
  }
}
