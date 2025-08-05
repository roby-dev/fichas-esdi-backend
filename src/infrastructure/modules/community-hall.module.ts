import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CreateCommunityHallUseCase } from 'src/application/use-cases/community-hall/create-community-hall.use-case';
import { FindCommunityHallByIdUseCase } from 'src/application/use-cases/community-hall/find-community-hall-by-id.use-case';
import { FindAllCommunityHallsUseCase } from 'src/application/use-cases/community-hall/find-all-community-halls.use-case';
import { CommunityHallController } from '../controllers/community-hall.controller';
import { FindAllCommunityHallsByCommitteeIdUseCase } from 'src/application/use-cases/community-hall/find-all-community-halls-by-committee-id.use-case';
import { ContextModule } from 'src/common/context/context.module';
import { AuthModule } from './auth.module';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule],
  controllers: [CommunityHallController],
  providers: [
    CreateCommunityHallUseCase,
    FindCommunityHallByIdUseCase,
    FindAllCommunityHallsUseCase,
    FindAllCommunityHallsByCommitteeIdUseCase,
  ],
})
export class CommunityHallmodule {}
