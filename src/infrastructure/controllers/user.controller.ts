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
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@ApiTags('Usuarios')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @ApiCreatedResponse({ type: UserResponseDto })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.create(dto);
  }

  @Patch(':id/roles')
  @ApiBearerAuth('access-token')
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
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: UserResponseDto })
  async findById(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.service.findById(id);
  }
}
