import { Module } from '@nestjs/common';
import { ContextModule } from 'src/common/contexts/context.module';
import { AuditService } from 'src/application/services/audit.service';
import { DatabaseModule } from '../database/database.module';
import { AuditController } from '../controllers/audit.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
