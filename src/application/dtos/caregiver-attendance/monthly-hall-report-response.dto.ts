import { ApiProperty } from '@nestjs/swagger';

export class BlockOutcomeDto {
  @ApiProperty() localDate: string;
  @ApiProperty() blockId: string;
  @ApiProperty() blockName: string;
  @ApiProperty()
  outcome: 'present' | 'tardy' | 'special' | 'justified' | 'absent';
  @ApiProperty({ nullable: true }) entryTime: string | null;
  @ApiProperty({ nullable: true }) reason: string | null;
}

export class CaregiverMonthlySummaryDto {
  @ApiProperty() caregiverId: string;
  @ApiProperty() fullName: string;
  @ApiProperty({ type: [BlockOutcomeDto] }) outcomes: BlockOutcomeDto[];
  @ApiProperty() presentCount: number;
  @ApiProperty() tardyCount: number;
  @ApiProperty() specialCount: number;
  @ApiProperty() justifiedAbsenceCount: number;
  @ApiProperty() unjustifiedAbsenceCount: number;
}

export class MonthlyHallReportResponseDto {
  @ApiProperty() hallId: string;
  @ApiProperty() year: number;
  @ApiProperty() month: number;
  @ApiProperty({ type: [CaregiverMonthlySummaryDto] })
  caregivers: CaregiverMonthlySummaryDto[];
}
