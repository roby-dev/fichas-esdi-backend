import { Module } from '@nestjs/common';
import { PersonController } from '../controllers/person.controller';
import { PersonService } from 'src/application/services/person.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PersonController],
  providers: [PersonService],
})
export class PersonModule {}
