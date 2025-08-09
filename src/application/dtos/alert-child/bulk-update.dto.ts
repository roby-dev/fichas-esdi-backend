import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, isNotEmpty, IsString } from 'class-validator';

export class BulkUpdateDto {
  @ApiProperty({
    example: '315',
    type: 'string',
    description: 'Id del comite de gestión logeado',
  })
  @IsString()
  @IsNotEmpty()
  committeeId: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Excel file (.xls or .xlsx) containing children data for bulk update',
  })
  @IsNotEmpty()
  file: Express.Multer.File;
}
