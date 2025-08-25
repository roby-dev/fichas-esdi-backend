import { User } from './user.entity';

export class Session {
  constructor(
    private readonly _userId: string,
    private readonly _tokenId: string,
    private readonly _active: boolean,
    private readonly _ipAddress?: string | string[] | undefined,
    private readonly _userAgent?: string,
    private readonly _id?: string,
    private readonly _user?: User,
  ) {}

  get userId(): string {
    return this._userId;
  }

  get tokenId(): string {
    return this._tokenId;
  }

  get active(): boolean {
    return this._active;
  }

  get ipAddress(): string | string[] | undefined {
    return this._ipAddress;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get id(): string | undefined {
    return this._id;
  }

  get user(): User | undefined {
    return this._user;
  }

  static create(
    userId: string,
    tokenId: string,
    ipAddress?: string | string[] | undefined,
    userAgent?: string,
    user?: User,
  ): Session {
    return new Session(
      userId,
      tokenId,
      true,
      ipAddress,
      userAgent,
      undefined,
      user,
    );
  }

  static fromPrimitives(data: {
    userId: string;
    tokenId: string;
    active: boolean;
    ipAddress?: string | string[] | undefined;
    userAgent?: string;
    id?: string;
    user?: User;
  }): Session {
    return new Session(
      data.userId,
      data.tokenId,
      data.active,
      data.ipAddress,
      data.userAgent,
      data.id,
      data.user,
    );
  }

  toPrimitives(): {
    userId: string;
    tokenId: string;
    active: boolean;
    ipAddress?: string | string[] | undefined;
    userAgent?: string;
    id?: string;
    user?: User;
  } {
    return {
      userId: this._userId,
      tokenId: this._tokenId,
      active: this._active,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      id: this._id,
      user: this._user,
    };
  }
}
