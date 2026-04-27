import { Module } from '@nestjs/common';
import { ManagementCommitteeController } from 'src/infrastructure/controllers/management-committee.controller';
import { ManagementCommitteeService } from 'src/application/services/management-committee.service';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [ManagementCommitteeController],
  providers: [ManagementCommitteeService],
})
export class ManagementCommitteeModule {}
