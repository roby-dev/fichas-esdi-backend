import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CreateCommunityHallUseCase } from 'src/application/use-cases/community-hall/create-community-hall.use-case';
import { FindCommunityHallByIdUseCase } from 'src/application/use-cases/community-hall/find-community-hall-by-id.use-case';
import { FindAllCommunityHallsUseCase } from 'src/application/use-cases/community-hall/find-all-community-halls.use-case';
import { CommunityHallController } from '../controllers/community-hall.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CommunityHallController],
  providers: [
    CreateCommunityHallUseCase,
    FindCommunityHallByIdUseCase,
    FindAllCommunityHallsUseCase,
  ],
})
export class CommunityHallmodule {}
