import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';
import { CommitteeMembershipController } from '../controllers/committee-membership.controller';
import { CommitteeMembershipService } from 'src/application/services/committee-membership.service';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [CommitteeMembershipController],
  providers: [CommitteeMembershipService],
})
export class CommitteeMembershipModule {}
