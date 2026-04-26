import { DomainException } from './domain.exception';

export class BadRequestException extends DomainException {
  constructor(message: string) {
    super(message, 'BadRequestException');
  }
}
