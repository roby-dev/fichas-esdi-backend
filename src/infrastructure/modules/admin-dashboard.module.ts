import { Module } from '@nestjs/common';
import { AdminDashboardService } from 'src/application/services/admin-dashboard.service';
import { DatabaseModule } from '../database/database.module';
import { AdminDashboardController } from '../controllers/admin-dashboard.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
