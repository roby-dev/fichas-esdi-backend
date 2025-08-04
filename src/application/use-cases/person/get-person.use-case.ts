import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersonRepository } from '../../../domain/repositories/person.repository';
import { PersonResponseDto } from 'src/application/dtos/person/person-response.dto';
import { PERSON_REPOSITORY } from 'src/domain/constants/tokens';

@Injectable()
export class GetPersonUseCase {
  constructor(
    @Inject(PERSON_REPOSITORY)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(id: string): Promise<PersonResponseDto> {
    const person = await this.personRepository.findById(id);

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return PersonResponseDto.fromDomain(person);
  }
}
