export class DomainException extends Error {
  constructor(public readonly message: string, public readonly name: string) {
    super(message);
  }
}
