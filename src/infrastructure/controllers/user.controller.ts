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
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserDto } from 'src/application/dtos/user/create-user.dto';
import { AssignRolesDto } from 'src/application/dtos/user/assign-roles.dto';
import { UserResponseDto } from 'src/application/dtos/user/user-response.dto';
import { UserService } from 'src/application/services/user.service';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Usuarios')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.create(dto);
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
    return this.service.assignRoles(id, dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: UserResponseDto })
  async findById(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.service.findById(id);
  }
}
