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
import { ContextModule } from 'src/common/context/context.module';

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
    AuthGuard,
  ],
  exports: [AUTH_SERVICE, AuthGuard, JwtModule],
})
export class AuthModule {}
