import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
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
import { AuthGuard } from '../guards/jwt-auth.guard';
import { LogoutUseCase } from 'src/application/use-cases/auth/logout.use-case';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshToken(
    @Body() dto: RefreshDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const info = req['requestInfo'] as RequestInfoContext;
    return this.refreshTokenUseCase.execute(dto.refreshToken, info);
  }

  @Get('logout')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(
    @Req() req: Request,
  ): Promise<{ status: boolean; message: string }> {
    const user = req['user'] as { sub: string; jti: string };
    const info = req['requestInfo'] as RequestInfoContext; // si middleware lo llenó
    return this.logoutUseCase.execute(user.jti, info.getIpAddress(), info.getUserAgent());
  }
}
