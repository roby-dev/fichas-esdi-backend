import { ApiProperty } from '@nestjs/swagger';
import { AuditEventResponseDto } from './audit-event-response.dto';

export class AuditPageResponseDto {
  @ApiProperty({ type: [AuditEventResponseDto] })
  items: AuditEventResponseDto[];

  @ApiProperty({ description: 'Total matching documents (ignoring pagination)' })
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
