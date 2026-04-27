import { Module } from '@nestjs/common';
import { RequestInfoContext } from './request-info.context';
import { RequestUserContext } from './user-context.service';

@Module({
  providers: [RequestUserContext, RequestInfoContext],
  exports: [RequestUserContext, RequestInfoContext],
})
export class ContextModule {}
