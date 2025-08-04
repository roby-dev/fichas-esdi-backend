import { ApiProperty } from '@nestjs/swagger';
import { Person } from 'src/domain/entities/person.entity';

export class PersonResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  birthDate: Date;

  @ApiProperty()
  age: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(person: Person): PersonResponseDto {
    const dto = new PersonResponseDto();
    dto.id = person.id;
    dto.firstName = person.firstName;
    dto.lastName = person.lastName;
    dto.fullName = person.fullName;
    dto.email = person.email.toString();
    dto.phone = person.phone.toString();
    dto.birthDate = person.birthDate;
    dto.age = person.age;
    dto.createdAt = person.createdAt;
    dto.updatedAt = person.updatedAt;
    return dto;
  }
}
