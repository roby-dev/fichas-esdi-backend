import { ApiProperty } from '@nestjs/swagger';

export class SessionUserSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiProperty({ description: 'Whether the latest session is active' })
  isOnline: boolean;

  @ApiProperty({ description: 'Total sessions ever created for this user' })
  totalSessions: number;

  @ApiProperty({ description: 'Active sessions right now' })
  activeSessions: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Timestamp of the most recent session',
  })
  lastSeenAt: Date;

  @ApiProperty({ required: false, description: 'IP of the latest session' })
  lastIpAddress?: string;

  @ApiProperty({
    required: false,
    description: 'User-Agent of the latest session',
  })
  lastUserAgent?: string;
}

export class SessionSummaryPageResponseDto {
  @ApiProperty({ type: [SessionUserSummaryDto] })
  items: SessionUserSummaryDto[];

  @ApiProperty({ description: 'Total distinct users with sessions' })
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
