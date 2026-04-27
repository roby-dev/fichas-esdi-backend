import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ChildController } from '../controllers/child.controller';
import { ChildService } from 'src/application/services/child.service';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule],
  controllers: [ChildController],
  providers: [ChildService],
})
export class ChildModule {}
