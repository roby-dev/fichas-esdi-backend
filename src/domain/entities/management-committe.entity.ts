export class ManagementCommittee {
  constructor(
    private readonly _name: string,
    private readonly _userId: string,
    private readonly _id?: string,
  ) {}

  get name(): string {
    return this._name;
  }

  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  static create(name: string, userId: string): ManagementCommittee {
    return new ManagementCommittee(name, userId);
  }

  static fromPrimitives(data: {
    name: string;
    userId: string;
    id?: string;
  }): ManagementCommittee {
    return new ManagementCommittee(data.name, data.userId, data.id);
  }

  toPrimitives(): { name: string; userId: string; id?: string } {
    return {
      name: this._name,
      userId: this._userId,
      id: this._id,
    };
  }
}
