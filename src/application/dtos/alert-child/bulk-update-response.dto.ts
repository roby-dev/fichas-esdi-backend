import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the bulk update was successful',
  })
  ok: boolean;

  @ApiProperty({
    example: 'Children updated successfully from Excel file.',
    description: 'Human-readable message describing the result',
  })
  message: string;
}
