import { ApiProperty } from '@nestjs/swagger';

export class CommitteeChildCountDto {
  @ApiProperty()
  committeeId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  count!: number;
}

export class CommunityHallChildCountDto {
  @ApiProperty()
  hallId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  committeeId!: string;

  @ApiProperty()
  committeeName!: string;

  @ApiProperty()
  count!: number;
}

export class ActiveSignalCountDto {
  @ApiProperty({ example: 'Señal de 2 meses' })
  signal!: string;

  @ApiProperty()
  count!: number;
}

export class ActiveSignalsBreakdownDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [ActiveSignalCountDto] })
  byType!: ActiveSignalCountDto[];
}

export class DashboardStatsResponseDto {
  @ApiProperty({ type: [CommitteeChildCountDto] })
  childrenByCommittee!: CommitteeChildCountDto[];

  @ApiProperty({ type: [CommunityHallChildCountDto] })
  childrenByCommunityHall!: CommunityHallChildCountDto[];

  @ApiProperty({ type: ActiveSignalsBreakdownDto })
  activeSignals!: ActiveSignalsBreakdownDto;
}
