export class ManagementCommittee {
  constructor(
    private readonly _committeeId: string,
    private readonly _name: string,
    private readonly _userId: string,
    private readonly _id?: string,
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

  static create(
    committeeId: string,
    name: string,
    userId: string,
  ): ManagementCommittee {
    return new ManagementCommittee(committeeId, name, userId);
  }

  static fromPrimitives(data: {
    committeeId: string;
    name: string;
    userId: string;
    id?: string;
  }): ManagementCommittee {
    return new ManagementCommittee(
      data.committeeId,
      data.name,
      data.userId,
      data.id,
    );
  }

  toPrimitives(): {
    committeeId: string;
    name: string;
    userId: string;
    id?: string;
  } {
    return {
      committeeId: this._committeeId,
      name: this._name,
      userId: this._userId,
      id: this._id,
    };
  }
}
