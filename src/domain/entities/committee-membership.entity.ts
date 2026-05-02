import { Committee } from './committee.entity';
import { User } from './user.entity';

export class CommitteeMembership {
  constructor(
    private readonly _committeeRef: string,
    private readonly _userRef: string,
    private readonly _id?: string,
    private readonly _committee?: Committee,
    private readonly _user?: User,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get committeeRef(): string {
    return this._committeeRef;
  }

  get userRef(): string {
    return this._userRef;
  }

  get committee(): Committee | undefined {
    return this._committee;
  }

  get user(): User | undefined {
    return this._user;
  }

  static create(committeeRef: string, userRef: string): CommitteeMembership {
    return new CommitteeMembership(committeeRef, userRef);
  }

  static fromPrimitives(data: {
    committeeRef: string;
    userRef: string;
    id?: string;
    committee?: Committee;
    user?: User;
  }): CommitteeMembership {
    return new CommitteeMembership(
      data.committeeRef,
      data.userRef,
      data.id,
      data.committee,
      data.user,
    );
  }

  toPrimitives(): {
    committeeRef: string;
    userRef: string;
    id?: string;
  } {
    return {
      committeeRef: this._committeeRef,
      userRef: this._userRef,
      id: this._id,
    };
  }
}
