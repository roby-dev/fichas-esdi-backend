import { Module } from '@nestjs/common';
import { PersonModule } from './infrastructure/modules/person.module';
import { ManagementCommitteeModule } from './infrastructure/modules/management-commitee.module';
import { CommunityHallmodule } from './infrastructure/modules/community-hall.module';
import { ChildModule } from './infrastructure/modules/child.module';
import { AuthModule } from './infrastructure/modules/auth.module';
import { UserModule } from './infrastructure/modules/user.module';
import { AlertChildModule } from './infrastructure/modules/alert-child.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),
    PersonModule,
    ManagementCommitteeModule,
    CommunityHallmodule,
    ChildModule,
    AuthModule,
    UserModule,
    AlertChildModule,
  ],
})
export class AppModule {}
