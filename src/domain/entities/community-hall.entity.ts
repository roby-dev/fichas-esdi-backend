import { ManagementCommittee } from './management-committe.entity';

export class CommunityHall {
  constructor(
    private readonly _localId: string,
    private readonly _name: string,
    private readonly _managementCommitteeId: string,
    private readonly _id?: string,
    private readonly _managementCommittee?: ManagementCommittee,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get localId(): string {
    return this._localId;
  }

  get name(): string {
    return this._name;
  }

  get managementCommitteeId(): string {
    return this._managementCommitteeId;
  }

  get managementCommittee(): ManagementCommittee | undefined {
    return this._managementCommittee;
  }

  static create(
    localId: string,
    name: string,
    managementCommitteeId: string,
    managementCommittee?: ManagementCommittee,
  ): CommunityHall {
    return new CommunityHall(
      localId,
      name,
      managementCommitteeId,
      undefined,
      managementCommittee,
    );
  }

  static fromPrimitives(data: {
    localId: string;
    name: string;
    managementCommitteeId: string;
    id?: string;
    managementCommittee?: ManagementCommittee;
  }): CommunityHall {
    return new CommunityHall(
      data.localId,
      data.name,
      data.managementCommitteeId,
      data.id,
      data.managementCommittee,
    );
  }

  toPrimitives() {
    return {
      localId: this._localId,
      name: this._name,
      managementCommitteeId: this._managementCommitteeId,
      id: this._id,
      managementCommittee: this._managementCommittee,
    };
  }
}
