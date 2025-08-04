export class Phone {
  private readonly phoneRegex = /^\+?[\d\s\-\(\)]+$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid phone format');
    }
  }

  private isValid(phone: string): boolean {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return cleanPhone.length >= 7 && this.phoneRegex.test(phone);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
