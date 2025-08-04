import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { CreatePersonDto } from 'src/application/dtos/person/create-person.dto';
import { PersonResponseDto } from 'src/application/dtos/person/person-response.dto';
import { PERSON_REPOSITORY } from 'src/domain/constants/tokens';
import { Person } from 'src/domain/entities/person.entity';
import type { PersonRepository } from 'src/domain/repositories/person.repository';

@Injectable()
export class CreatePersonUseCase {
  constructor(
    @Inject(PERSON_REPOSITORY)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(createPersonDto: CreatePersonDto): Promise<PersonResponseDto> {
    // Verificar si el email ya existe
    const existingPerson = await this.personRepository.findByEmail(
      createPersonDto.email,
    );
    if (existingPerson) {
      throw new ConflictException('Email already exists');
    }

    // Crear nueva persona
    const person = Person.create(
      createPersonDto.firstName,
      createPersonDto.lastName,
      createPersonDto.email,
      createPersonDto.phone,
      new Date(createPersonDto.birthDate),
    );

    // Guardar en repositorio
    const savedPerson = await this.personRepository.save(person);

    return PersonResponseDto.fromDomain(savedPerson);
  }
}
