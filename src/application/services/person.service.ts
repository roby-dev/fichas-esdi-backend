import { Inject, Injectable } from '@nestjs/common';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import { PERSON_REPOSITORY } from 'src/domain/constants/tokens';
import { Person } from 'src/domain/entities/person.entity';
import type { PersonRepository } from 'src/domain/repositories/person.repository';
import { CreatePersonDto } from '../dtos/person/create-person.dto';
import { PersonResponseDto } from '../dtos/person/person-response.dto';

@Injectable()
export class PersonService {
  constructor(
    @Inject(PERSON_REPOSITORY)
    private readonly personRepository: PersonRepository,
  ) {}

  async create(dto: CreatePersonDto): Promise<PersonResponseDto> {
    const existing = await this.personRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const person = Person.create(
      dto.firstName,
      dto.lastName,
      dto.email,
      dto.phone,
      new Date(dto.birthDate),
    );
    const saved = await this.personRepository.save(person);
    return PersonResponseDto.fromDomain(saved);
  }

  async findById(id: string): Promise<PersonResponseDto> {
    const person = await this.personRepository.findById(id);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return PersonResponseDto.fromDomain(person);
  }
}
