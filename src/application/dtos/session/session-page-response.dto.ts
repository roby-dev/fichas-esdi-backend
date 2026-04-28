import { ApiProperty } from '@nestjs/swagger';
import { SessionResponseDto } from './session-response.dto';

export class SessionPageResponseDto {
  @ApiProperty({ type: [SessionResponseDto] })
  items: SessionResponseDto[];

  @ApiProperty({ description: 'Total matching documents (ignoring pagination)' })
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
