import { Module } from '@nestjs/common';
import { PersonModule } from './infrastructure/modules/person.module';
import { ManagementCommitteeModule } from './infrastructure/modules/management-commitee.module';
import { CommunityHallmodule } from './infrastructure/modules/community-hall.module';
import { ChildModule } from './infrastructure/modules/child.module';
import { AuthModule } from './infrastructure/modules/auth.module';
import { UserModule } from './infrastructure/modules/user.module';

@Module({
  imports: [
    PersonModule,
    ManagementCommitteeModule,
    CommunityHallmodule,
    ChildModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
