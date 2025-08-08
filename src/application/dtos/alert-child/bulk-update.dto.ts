import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Excel file (.xls or .xlsx) containing children data for bulk update',
  })
  file: any;
}
