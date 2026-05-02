import {
  Body,
  Controller,
  Delete,
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
import { CommitteeMembershipService } from 'src/application/services/committee-membership.service';
import { CommitteeMembershipResponseDto } from 'src/application/dtos/committee-membership/committee-membership-response.dto';
import { CreateCommitteeMembershipDto } from 'src/application/dtos/committee-membership/create-committee-membership.dto';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@ApiTags('committee-memberships')
@Controller('committee-memberships')
export class CommitteeMembershipController {
  constructor(private readonly service: CommitteeMembershipService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['admin'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar un usuario a un comité de gestión (solo admin)',
  })
  @ApiResponse({ status: 201, type: CommitteeMembershipResponseDto })
  async assign(
    @Body() dto: CreateCommitteeMembershipDto,
  ): Promise<CommitteeMembershipResponseDto> {
    return this.service.assign(dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['admin'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desasignar un usuario de un comité (solo admin)',
  })
  @ApiResponse({ status: 204 })
  async unassign(
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<void> {
    await this.service.unassign(id);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['admin'])
  @ApiOperation({ summary: 'Listar todas las asignaciones (solo admin)' })
  @ApiResponse({ status: 200, type: [CommitteeMembershipResponseDto] })
  async findAll(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommitteeMembershipResponseDto[]> {
    return this.service.findAll(Number(limit), Number(offset));
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Listar los comités del usuario logueado',
  })
  @ApiResponse({ status: 200, type: [CommitteeMembershipResponseDto] })
  async findMine(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommitteeMembershipResponseDto[]> {
    return this.service.findCommitteesOfCurrentUser(
      Number(limit),
      Number(offset),
    );
  }

  @Get('by-user/:userId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['admin'])
  @ApiOperation({
    summary: 'Listar los comités de un usuario específico (solo admin)',
  })
  @ApiResponse({ status: 200, type: [CommitteeMembershipResponseDto] })
  async findByUser(
    @Param('userId', ValidateObjectIdPipe) userId: string,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommitteeMembershipResponseDto[]> {
    return this.service.findCommitteesOfUser(
      userId,
      Number(limit),
      Number(offset),
    );
  }

  @Get('by-committee/:committeeId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['admin'])
  @ApiOperation({
    summary: 'Listar los usuarios asignados a un comité (solo admin)',
  })
  @ApiResponse({ status: 200, type: [CommitteeMembershipResponseDto] })
  async findByCommittee(
    @Param('committeeId', ValidateObjectIdPipe) committeeId: string,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CommitteeMembershipResponseDto[]> {
    return this.service.findUsersOfCommittee(
      committeeId,
      Number(limit),
      Number(offset),
    );
  }
}
