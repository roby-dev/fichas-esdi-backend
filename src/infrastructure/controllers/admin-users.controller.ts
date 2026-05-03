import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminUserService } from 'src/application/services/admin-user.service';
import { ResetPasswordDto } from 'src/application/dtos/auth/reset-password.dto';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@ApiTags('admin/users')
@Controller('admin/users')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles(['admin'])
export class AdminUsersController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Resetear contraseña de un usuario y forzar cambio en próximo login',
  })
  @ApiResponse({ status: 200, schema: { example: { ok: true } } })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ ok: true }> {
    return this.adminUserService.resetPassword(id, dto.temporaryPassword);
  }
}
