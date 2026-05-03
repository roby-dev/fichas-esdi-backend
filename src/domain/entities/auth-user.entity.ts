export class AuthUser {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly roles: string[],
    public readonly mustChangePassword: boolean = false,
  ) {}
}
