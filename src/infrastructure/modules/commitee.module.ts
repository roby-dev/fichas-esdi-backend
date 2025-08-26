import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/contexts/context.module';
import { CommitteeController } from '../controllers/committee.controller';
import { CreateCommitteeUseCase } from 'src/application/use-cases/committee/create-management-committee.use-case';
import { FindAllCommitteesUseCase } from 'src/application/use-cases/committee/find-all-management-committees.use-case';
import { FindCommitteeByIdUseCase } from 'src/application/use-cases/committee/find-management-committee-by-id.use-case';
import { UpdateCommitteeUseCase } from 'src/application/use-cases/committee/update-management-committee.use-case';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [CommitteeController],
  providers: [
    CreateCommitteeUseCase,
    FindCommitteeByIdUseCase,
    FindAllCommitteesUseCase,
    UpdateCommitteeUseCase,
  ],
})
export class CommitteeModule {}
