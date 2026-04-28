import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SessionQueryDto } from 'src/application/dtos/session/session-query.dto';
import { SessionResponseDto } from 'src/application/dtos/session/session-response.dto';
import { SessionPageResponseDto } from 'src/application/dtos/session/session-page-response.dto';
import { SessionService } from 'src/application/services/session.service';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../guards/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('admin/sessions')
@Controller('admin/sessions')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Roles(['admin'])
export class SessionController {
  constructor(private readonly service: SessionService) {}

  @Get()
  @ApiOperation({
    summary: 'List sessions (admin only) with filters and pagination',
  })
  @ApiOkResponse({ type: SessionPageResponseDto })
  async findAll(
    @Query() query: SessionQueryDto,
  ): Promise<SessionPageResponseDto> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const page = await this.service.query(
      {
        userId: query.userId,
        active: query.active,
      },
      { limit, offset },
    );

    return {
      items: page.items.map(SessionResponseDto.fromDomain),
      total: page.total,
      limit,
      offset,
    };
  }
}
