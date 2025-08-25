import { Module } from '@nestjs/common';
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
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN'),
        },
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
    AuthGuard,
    RolesGuard,
    RequestInfoContext,
    AppGateway,
  ],
  exports: [AUTH_SERVICE, AuthGuard, JwtModule, RolesGuard],
})
export class AuthModule {}
