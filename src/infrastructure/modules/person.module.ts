import { Module } from '@nestjs/common';
import { PersonController } from '../controllers/person.controller';
import { CreatePersonUseCase } from 'src/application/use-cases/person/create-person.use-case';
import { GetPersonUseCase } from 'src/application/use-cases/person/get-person.use-case';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PersonController],
  providers: [CreatePersonUseCase, GetPersonUseCase],
})
export class PersonModule {}
