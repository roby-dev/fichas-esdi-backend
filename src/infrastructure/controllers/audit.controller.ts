import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuditQueryDto } from 'src/application/dtos/audit/audit-query.dto';
import { AuditEventResponseDto } from 'src/application/dtos/audit/audit-event-response.dto';
import { AuditPageResponseDto } from 'src/application/dtos/audit/audit-page-response.dto';
import { AuditService } from 'src/application/services/audit.service';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../guards/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('admin/audit')
@Controller('admin/audit')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard)
@Roles(['admin'])
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'List audit events (admin only) with filters and pagination',
  })
  @ApiOkResponse({ type: AuditPageResponseDto })
  async findAll(
    @Query() query: AuditQueryDto,
  ): Promise<AuditPageResponseDto> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const page = await this.service.query(
      {
        actorUserId: query.actorUserId,
        entityType: query.entityType,
        entityId: query.entityId,
        action: query.action,
        from: query.from,
        to: query.to,
      },
      { limit, offset },
    );

    return {
      items: page.items.map(AuditEventResponseDto.fromDomain),
      total: page.total,
      limit,
      offset,
    };
  }
}
