// src/common/context/request-info.context.ts
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestInfoContext {
  private ipAddress: string | string[] | undefined;
  private userAgent: string | undefined;

  setIpAddress(ip: string | string[] | undefined) {
    this.ipAddress = ip;
  }

  setUserAgent(ua: string | undefined) {
    this.userAgent = ua;
  }

  getIpAddress(): string  | string[] | undefined{
    return this.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.userAgent;
  }
}
