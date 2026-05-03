import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoginUseCase } from 'src/application/use-cases/auth/login.use-case';
import { AUTH_SERVICE } from 'src/domain/constants/tokens';
import { JwtAuthService } from '../services/jwt-auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../controllers/auth.controller';
import { MongoModule } from '../database/mongo/mongo.module';
import { RefreshTokenUseCase } from 'src/application/use-cases/auth/refresh-token.use-case';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ContextModule } from 'src/common/contexts/context.module';
import { RequestInfoContext } from 'src/common/contexts/request-info.context';
import { LogoutUseCase } from 'src/application/use-cases/auth/logout.use-case';
import { AppGateway } from '../websockets/app-gateway.socket';
import { ActivateSessionUseCase } from 'src/application/use-cases/auth/active-session.use-case';
import { ChangePasswordUseCase } from 'src/application/use-cases/auth/change-password.use-case';
import { MustChangePasswordGuard } from '../guards/must-change-password.guard';
import { AuditService } from 'src/application/services/audit.service';

@Module({
  imports: [
    ContextModule,
    ConfigModule,
    MongoModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_SERVICE,
      useClass: JwtAuthService,
    },
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ActivateSessionUseCase,
    ChangePasswordUseCase,
    AuthGuard,
    RolesGuard,
    RequestInfoContext,
    AppGateway,
    AuditService,
    MustChangePasswordGuard,
    // ORDER MATTERS: AuthGuard must run before MustChangePasswordGuard so
    // req.user is populated by the time MustChangePasswordGuard reads it.
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MustChangePasswordGuard,
    },
  ],
  exports: [AUTH_SERVICE, AuthGuard, JwtModule, RolesGuard, ContextModule],
})
export class AuthModule {}
