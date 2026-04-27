import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ChildController } from '../controllers/child.controller';
import { ChildService } from 'src/application/services/child.service';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';
import { AuditModule } from './audit.module';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule, AuditModule],
  controllers: [ChildController],
  providers: [ChildService],
})
export class ChildModule {}
