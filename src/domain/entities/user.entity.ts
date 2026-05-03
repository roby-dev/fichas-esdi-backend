export class User {
  set roles(value: string[]) {
    this._roles = value;
  }
  constructor(
    private readonly _email: string,
    private readonly _passwordHash: string,
    private _roles: string[] = [],
    private readonly _id?: string,
    private readonly _mustChangePassword: boolean = false,
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

  get mustChangePassword(): boolean {
    return this._mustChangePassword;
  }

  /**
   * Returns a NEW User instance with the updated password hash and mustChangePassword flag.
   * This is the single mutation gate for credentials — never mutate _passwordHash directly.
   */
  withPassword(newHash: string, mustChange: boolean): User {
    return new User(this._email, newHash, this._roles, this._id, mustChange);
  }

  static create(email: string, password: string, roles: string[] = ['user']): User {
    return new User(email, password, roles);
  }

  toPrimitives(): {
    email: string;
    passwordHash: string;
    roles: string[];
    id?: string;
    mustChangePassword: boolean;
  } {
    return {
      id: this._id,
      email: this._email,
      passwordHash: this._passwordHash,
      roles: this._roles,
      mustChangePassword: this._mustChangePassword,
    };
  }

  static fromPrimitives(data: {
    email: string;
    passwordHash: string;
    roles?: string[];
    id?: string;
    mustChangePassword?: boolean;
  }): User {
    return new User(
      data.email,
      data.passwordHash,
      data.roles ?? [],
      data.id,
      data.mustChangePassword ?? false,
    );
  }
}
