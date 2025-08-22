import { Module } from '@nestjs/common';
import { ManagementCommitteeController } from 'src/infrastructure/controllers/management-committee.controller';
import { CreateManagementCommitteeUseCase } from '../../application/use-cases/management-committee/create-management-committee.use-case';
import { FindManagementCommitteeByIdUseCase } from '../../application/use-cases/management-committee/find-management-committee-by-id.use-case';
import { FindAllManagementCommitteesUseCase } from '../../application/use-cases/management-committee/find-all-management-committees.use-case';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/context/context.module';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [ManagementCommitteeController],
  providers: [
    CreateManagementCommitteeUseCase,
    FindManagementCommitteeByIdUseCase,
    FindAllManagementCommitteesUseCase,
  ],
})
export class ManagementCommitteeModule {}
