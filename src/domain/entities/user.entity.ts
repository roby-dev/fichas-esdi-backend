export class User {
  set roles(value: string[]) {
    this._roles = value;
  }
  constructor(
    private readonly _email: string,
    private readonly _passwordHash: string,
    private _roles: string[] = [],
    private readonly _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get roles(): string[] {
    return this._roles;
  }

  static create(email: string, password: string, roles: string[] = ['user']): User {
    return new User(email, password, roles);
  }

  toPrimitives(): {
    email: string;
    passwordHash: string;
    roles: string[];
    id?: string;
  } {
    return {
      id: this._id,
      email: this._email,
      passwordHash: this._passwordHash,
      roles: this._roles,
    };
  }

  static fromPrimitives(data: {
    email: string;
    passwordHash: string;
    roles?: string[];
    id?: string;
  }): User {
    return new User(data.email, data.passwordHash, data.roles ?? [], data.id);
  }
}
