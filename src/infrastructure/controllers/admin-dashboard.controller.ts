import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminDashboardService } from 'src/application/services/admin-dashboard.service';
import { DashboardStatsResponseDto } from 'src/application/dtos/dashboard/dashboard-stats-response.dto';
import { Roles } from '../guards/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('admin/dashboard')
@Controller('admin/dashboard')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles(['admin'])
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary:
      'Children counts by committee and community hall, plus active alert signals breakdown',
  })
  @ApiOkResponse({ type: DashboardStatsResponseDto })
  getStats(): Promise<DashboardStatsResponseDto> {
    return this.service.getStats();
  }
}
