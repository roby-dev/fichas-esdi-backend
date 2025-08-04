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
import { CreatePersonUseCase } from 'src/application/use-cases/person/create-person.use-case';
import { GetPersonUseCase } from 'src/application/use-cases/person/get-person.use-case';

@ApiTags('persons')
@Controller('persons')
export class PersonController {
  constructor(
    private readonly createPersonUseCase: CreatePersonUseCase,
    private readonly getPersonUseCase: GetPersonUseCase,
    // ... otros use cases
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({ status: 201, type: PersonResponseDto })
  async create(
    @Body() createPersonDto: CreatePersonDto,
  ): Promise<PersonResponseDto> {
    return await this.createPersonUseCase.execute(createPersonDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get person by ID' })
  @ApiResponse({ status: 200, type: PersonResponseDto })
  async findOne(@Param('id') id: string): Promise<PersonResponseDto> {
    return await this.getPersonUseCase.execute(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all persons' })
  @ApiResponse({ status: 200, type: [PersonResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') _offset = '0',
  ): Promise<PersonResponseDto[]> {
    // Implementar use case para listar personas
    return [];
  }
}
