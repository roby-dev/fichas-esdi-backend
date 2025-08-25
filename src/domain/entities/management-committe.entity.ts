import { User } from './user.entity';

export class ManagementCommittee {
  constructor(
    private readonly _committeeId: string,
    private readonly _name: string,
    private readonly _userId: string,
    private readonly _id?: string,
    private readonly _user?: User,
  ) {}

  get committeeId(): string {
    return this._committeeId;
  }

  get name(): string {
    return this._name;
  }

  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get user(): User | undefined {
    return this._user;
  }

  static create(
    committeeId: string,
    name: string,
    userId: string,
    user?: User,
  ): ManagementCommittee {
    return new ManagementCommittee(committeeId, name, userId, undefined, user);
  }

  static fromPrimitives(data: {
    committeeId: string;
    name: string;
    userId: string;
    id?: string;
    user?: User;
  }): ManagementCommittee {
    return new ManagementCommittee(
      data.committeeId,
      data.name,
      data.userId,
      data.id,
      data.user,
    );
  }

  toPrimitives(): {
    committeeId: string;
    name: string;
    userId: string;
    id?: string;
    user?: User;
  } {
    return {
      committeeId: this._committeeId,
      name: this._name,
      userId: this._userId,
      id: this._id,
      user: this._user,
    };
  }
}
