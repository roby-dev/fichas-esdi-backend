import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';

export class Person {
  constructor(
    private _firstName: string,
    private _lastName: string,
    private _email: Email,
    private _phone: Phone,
    private _birthDate: Date,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
    private _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  get email(): Email {
    return this._email;
  }

  get phone(): Phone {
    return this._phone;
  }

  get birthDate(): Date {
    return this._birthDate;
  }

  get age(): number {
    const today = new Date();
    let age = today.getFullYear() - this._birthDate.getFullYear();
    const monthDiff = today.getMonth() - this._birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < this._birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updatePersonalInfo(
    firstName: string,
    lastName: string,
    email: Email,
    phone: Phone,
  ): void {
    this._firstName = firstName;
    this._lastName = lastName;
    this._email = email;
    this._phone = phone;
    this._updatedAt = new Date();
  }

  static create(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    birthDate: Date,
  ): Person {
    return new Person(
      firstName,
      lastName,
      new Email(email),
      new Phone(phone),
      birthDate,
    );
  }
}
