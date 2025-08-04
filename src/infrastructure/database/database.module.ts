import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { env } from 'process';
import { MongoModule } from './mongo/mongo.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AUTH_SERVICE } from 'src/domain/constants/tokens';
import { JwtAuthService } from '../services/jwt-auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/FichasEsdiDB',
        ),
      }),
      inject: [ConfigService],
    }),
    MongoModule,
  ],
  exports: [MongoModule],
})
export class DatabaseModule {}
