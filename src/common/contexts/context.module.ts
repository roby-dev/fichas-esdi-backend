// src/app.module.ts o src/common/context/context.module.ts
import { Module } from '@nestjs/common';
import { RequestUserContext } from './user-context.service';

@Module({
  providers: [RequestUserContext],
  exports: [RequestUserContext],
})
export class ContextModule {}
