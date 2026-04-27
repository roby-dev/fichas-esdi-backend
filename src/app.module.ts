import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PersonModule } from './infrastructure/modules/person.module';
import { ManagementCommitteeModule } from './infrastructure/modules/management-committee.module';
import { CommunityHallmodule } from './infrastructure/modules/community-hall.module';
import { ChildModule } from './infrastructure/modules/child.module';
import { AuthModule } from './infrastructure/modules/auth.module';
import { UserModule } from './infrastructure/modules/user.module';
import { AlertChildModule } from './infrastructure/modules/alert-child.module';
import { RequestInfoMiddleware } from './infrastructure/middlewares/request-info.middleware';
import { RequestInfoContext } from './common/contexts/request-info.context';
import { AppGateway } from './infrastructure/websockets/app-gateway.socket';
import { CommitteeModule } from './infrastructure/modules/committee.module';

@Module({
  imports: [
    PersonModule,
    ManagementCommitteeModule,
    CommunityHallmodule,
    ChildModule,
    AuthModule,
    UserModule,
    AlertChildModule,
    CommitteeModule,
  ],
  providers: [RequestInfoContext],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestInfoMiddleware).forRoutes('*');
  }
}
