import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserController } from '../controllers/user.controller';
import { UserService } from 'src/application/services/user.service';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
