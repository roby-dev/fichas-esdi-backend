import { Module } from '@nestjs/common';
import { ContextModule } from 'src/common/contexts/context.module';
import { SessionService } from 'src/application/services/session.service';
import { DatabaseModule } from '../database/database.module';
import { SessionController } from '../controllers/session.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
