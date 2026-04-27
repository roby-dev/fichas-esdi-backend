import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';
import { CommitteeController } from '../controllers/committee.controller';
import { CommitteeService } from 'src/application/services/committee.service';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [CommitteeController],
  providers: [CommitteeService],
})
export class CommitteeModule {}
