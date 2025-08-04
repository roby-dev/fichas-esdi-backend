export class CommunityHall {
  constructor(
    private readonly _name: string,
    private readonly _managementCommitteeId: string,
    private readonly _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get managementCommitteeId(): string {
    return this._managementCommitteeId;
  }

  static create(name: string, managementCommitteeId: string): CommunityHall {
    return new CommunityHall(name, managementCommitteeId);
  }

  static fromPrimitives(data: {
    name: string;
    managementCommitteeId: string;
    id?: string;
  }): CommunityHall {
    return new CommunityHall(data.name, data.managementCommitteeId, data.id);
  }

  toPrimitives() {
    return {
      name: this._name,
      managementCommitteeId: this._managementCommitteeId,
      id: this._id,
    };
  }
}
