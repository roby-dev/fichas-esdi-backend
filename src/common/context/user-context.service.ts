import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestUserContext {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  getUserId(): string {
    if (!this.userId) {
      throw new Error('User ID no está definido');
    }
    return this.userId;
  }
}
