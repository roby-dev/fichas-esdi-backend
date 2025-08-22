import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CreateChildUseCase } from 'src/application/use-cases/child/create-child.use-case';
import { UpdateChildUseCase } from 'src/application/use-cases/child/update-child.use-case';
import { DeleteChildUseCase } from 'src/application/use-cases/child/delete-child.use-case';
import { FindChildByIdUseCase } from 'src/application/use-cases/child/find-child-by-id.use-case';
import { FindAllChildrenUseCase } from 'src/application/use-cases/child/find-all-children.use-case';
import { ChildController } from '../controllers/child.controller';
import { ContextModule } from 'src/common/context/context.module';
import { AuthModule } from './auth.module';
import { FindAllChildrenByCommitteeUseCase } from 'src/application/use-cases/child/find-all-children-by-committee.use-case';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule],
  controllers: [ChildController],
  providers: [
    CreateChildUseCase,
    UpdateChildUseCase,
    DeleteChildUseCase,
    FindChildByIdUseCase,
    FindAllChildrenUseCase,
    FindAllChildrenByCommitteeUseCase,
  ],
})
export class ChildModule {}
