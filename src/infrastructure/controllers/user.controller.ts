import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateUserUseCase } from 'src/application/use-cases/user/create-user.use-case';
import { AssignRolesUseCase } from 'src/application/use-cases/user/assign-roles.use-case';
import { CreateUserDto } from 'src/application/dtos/user/create-user.dto';
import { AssignRolesDto } from 'src/application/dtos/user/assign-roles.dto';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { FindAllUsersUseCase } from 'src/application/use-cases/user/find-all-users.use-case';
import { FindUserByIdUseCase } from 'src/application/use-cases/user/find-user-by-id.use-case';
import { AuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Usuarios')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly assignRolesUseCase: AssignRolesUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(dto);
  }

  @Patch(':id/roles')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  async assignRoles(
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: AssignRolesDto,
  ): Promise<UserResponseDto> {
    return this.assignRolesUseCase.execute(id, dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    return this.findAllUsersUseCase.execute();
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: UserResponseDto })
  async findById(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.findUserByIdUseCase.execute(id);
  }
}
