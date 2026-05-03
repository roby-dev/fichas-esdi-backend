import { Module } from '@nestjs/common';
import { AdminUserService } from 'src/application/services/admin-user.service';
import { AdminUsersController } from '../controllers/admin-users.controller';
import { AuthModule } from './auth.module';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from './audit.module';

@Module({
  imports: [AuthModule, DatabaseModule, AuditModule],
  controllers: [AdminUsersController],
  providers: [AdminUserService],
})
export class AdminUsersModule {}
