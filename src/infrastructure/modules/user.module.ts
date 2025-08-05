import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserController } from '../controllers/user.controller';
import { CreateUserUseCase } from 'src/application/use-cases/user/create-user.use-case';
import { AssignRolesUseCase } from 'src/application/use-cases/user/assign-roles.use-case';
import { FindAllUsersUseCase } from 'src/application/use-cases/user/find-all-users.use-case';
import { FindUserByIdUseCase } from 'src/application/use-cases/user/find-user-by-id.use-case';
import { AuthModule } from './auth.module';
import { ContextModule } from 'src/common/context/context.module';

@Module({
  imports: [ContextModule, DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    AssignRolesUseCase,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
  ],
})
export class UserModule {}
