import { ApiProperty } from '@nestjs/swagger';

export class HallSummaryDto {
  @ApiProperty() hallId: string;
  @ApiProperty() hallName: string;
  @ApiProperty() presentCount: number;
  @ApiProperty() tardyCount: number;
  @ApiProperty() specialCount: number;
  @ApiProperty() justifiedAbsenceCount: number;
  @ApiProperty() unjustifiedAbsenceCount: number;
}

export class MonthlyCommitteeReportResponseDto {
  @ApiProperty() committeeId: string;
  @ApiProperty() year: number;
  @ApiProperty() month: number;
  @ApiProperty({ type: [HallSummaryDto] }) halls: HallSummaryDto[];
}
