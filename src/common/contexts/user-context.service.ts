import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestUserContext {
  private userId: string | null = null;
  private userEmail: string | null = null;
  private tokenId: string | null = null;
  private ipAddress: string | string[] | undefined;
  private userAgent: string | undefined;

  setIpAddress(ipAddress: string | string[] | undefined) {
    this.ipAddress = ipAddress;
  }

  setUserAgent(userAgent: string | undefined) {
    this.userAgent = userAgent;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setUserEmail(userEmail: string) {
    this.userEmail = userEmail;
  }

  setTokenId(tokenId: string) {
    this.tokenId = tokenId;
  }

  getUserId(): string {
    if (!this.userId) {
      throw new Error('User ID no está definido');
    }
    return this.userId;
  }

  getUserEmail(): string {
    if (!this.userEmail) {
      throw new Error('User Email no está definido');
    }
    return this.userEmail;
  }

  getTokenId(): string | null {
    return this.tokenId;
  }

  getIpAddress(): string | undefined | string[] {
    return this.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.userAgent;
  }
}
