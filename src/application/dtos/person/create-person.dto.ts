import {
  IsString,
  IsEmail,
  IsDateString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePersonDto {
  @ApiProperty({
    description: 'First name of the person',
    example: 'Roby Gerson',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Last name of the person',
    example: 'Zuñoiga Silva',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'rgersonzs95@gmail.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number in international format',
    example: '+51921781680',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[\d\s\-\(\)]{7,15}$/, { message: 'Invalid phone format' })
  phone: string;

  @ApiProperty({
    description: 'Birth date in ISO format (YYYY-MM-DD)',
    example: '1995-05-25',
  })
  @IsDateString(
    {},
    { message: 'Invalid date format, expected ISO string (YYYY-MM-DD)' },
  )
  birthDate: string;
}
