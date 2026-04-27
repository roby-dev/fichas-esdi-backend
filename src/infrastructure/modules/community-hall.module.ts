import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CommunityHallController } from '../controllers/community-hall.controller';
import { CommunityHallService } from 'src/application/services/community-hall.service';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule],
  controllers: [CommunityHallController],
  providers: [CommunityHallService],
})
export class CommunityHallmodule {}
