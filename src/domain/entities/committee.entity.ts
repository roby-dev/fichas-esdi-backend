import { User } from './user.entity';

export class Committee {
  constructor(
    private readonly _committeeId: string,
    private readonly _name: string,
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

  static create(committeeId: string, name: string): Committee {
    return new Committee(committeeId, name);
  }

  static fromPrimitives(data: {
    committeeId: string;
    name: string;
    id?: string;
  }): Committee {
    return new Committee(data.committeeId, data.name, data.id);
  }

  toPrimitives(): {
    committeeId: string;
    name: string;
    id?: string;
  } {
    return {
      committeeId: this._committeeId,
      name: this._name,
      id: this._id,
    };
  }
}
