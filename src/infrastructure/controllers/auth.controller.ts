import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { LoginUseCase } from 'src/application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from 'src/application/use-cases/auth/refresh-token.use-case';
import { RefreshDto } from 'src/application/dtos/auth/refres.dto';
import type { Request } from 'express';
import { RequestInfoContext } from 'src/common/contexts/request-info.context';
import { LogoutUseCase } from 'src/application/use-cases/auth/logout.use-case';
import { AllowWhenMustChangePassword } from '../guards/allow-when-must-change-password.decorator';
import { Public } from '../guards/public.decorator';
import { ChangePasswordUseCase } from 'src/application/use-cases/auth/change-password.use-case';
import { ChangePasswordDto } from 'src/application/dtos/auth/change-password.dto';
import { ChangePasswordResponseDto } from 'src/application/dtos/auth/change-password-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const info = req['requestInfo'] as RequestInfoContext;
    return this.loginUseCase.execute(dto, info);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshToken(
    @Body() dto: RefreshDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const info = req['requestInfo'] as RequestInfoContext;
    return this.refreshTokenUseCase.execute(dto.refreshToken, info);
  }

  // Flagged users must always be able to log out.
  @Post('logout')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @AllowWhenMustChangePassword()
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(
    @Req() req: Request,
  ): Promise<{ status: boolean; message: string }> {
    const user = req['user'] as { sub: string; jti: string };
    const info = req['requestInfo'] as RequestInfoContext;
    return this.logoutUseCase.execute(user.jti, info.getIpAddress(), info.getUserAgent());
  }

  // Reachable while mustChangePassword === true — this IS the flow.
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @AllowWhenMustChangePassword()
  @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, type: ChangePasswordResponseDto })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<ChangePasswordResponseDto> {
    const user = req['user'] as { jti: string };
    return this.changePasswordUseCase.execute(dto, user.jti);
  }
}
