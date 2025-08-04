import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Person } from '../../../../domain/entities/person.entity';
import { Person as PersonInfrastructure} from '../schemas/person.schema';
import { Email } from '../../../../domain/value-objects/email.vo';
import { Phone } from '../../../../domain/value-objects/phone.vo';
import { PersonDocument } from '../schemas/person.schema';

@Injectable()
export class MongoPersonRepository implements PersonRepository {
  constructor(
    @InjectModel(PersonInfrastructure.name)
    private personModel: Model<PersonDocument>,
  ) {}

  async save(person: Person): Promise<Person> {
    const personDoc = new this.personModel({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email.toString(),
      phone: person.phone.toString(),
      birthDate: person.birthDate,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    });

    const saved = await personDoc.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Person | null> {
    const person = await this.personModel.findById(id).exec();
    return person ? this.toDomain(person) : null;
  }

  async findAll(limit = 10, offset = 0): Promise<Person[]> {
    const persons = await this.personModel
      .find()
      .skip(offset)
      .limit(limit)
      .exec();

    return persons.map((person) => this.toDomain(person));
  }

  async update(person: Person): Promise<Person> {
    const updated = await this.personModel
      .findByIdAndUpdate(
        person.id,
        {
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email.toString(),
          phone: person.phone.toString(),
          updatedAt: person.updatedAt,
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new Error(`Person with id ${person.id} not found`);
    }

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.personModel.findByIdAndDelete(id).exec();
  }

  async findByEmail(email: string): Promise<Person | null> {
    const person = await this.personModel.findOne({ email }).exec();
    return person ? this.toDomain(person) : null;
  }

  private toDomain(personDoc: PersonDocument): Person {
    const id = personDoc._id?.toString() ?? undefined;

    return new Person(
      personDoc.firstName,
      personDoc.lastName,
      new Email(personDoc.email),
      new Phone(personDoc.phone),
      personDoc.birthDate,
      personDoc.createdAt,
      personDoc.updatedAt,
      id,
    );
  }
}
