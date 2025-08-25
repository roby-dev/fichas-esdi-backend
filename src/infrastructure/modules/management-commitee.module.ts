import { Module } from '@nestjs/common';
import { ManagementCommitteeController } from 'src/infrastructure/controllers/management-committee.controller';
import { CreateManagementCommitteeUseCase } from '../../application/use-cases/management-committee/create-management-committee.use-case';
import { FindManagementCommitteeByIdUseCase } from '../../application/use-cases/management-committee/find-management-committee-by-id.use-case';
import { FindAllManagementCommitteesUseCase } from '../../application/use-cases/management-committee/find-all-management-committees.use-case';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from './auth.module';
import { FindAllManagementCommitteesByUserUseCase } from 'src/application/use-cases/management-committee/find-all-management-committees-by-user.use-case';
import { ContextModule } from 'src/common/contexts/context.module';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [ManagementCommitteeController],
  providers: [
    CreateManagementCommitteeUseCase,
    FindManagementCommitteeByIdUseCase,
    FindAllManagementCommitteesUseCase,
    FindAllManagementCommitteesByUserUseCase,
  ],
})
export class ManagementCommitteeModule {}
