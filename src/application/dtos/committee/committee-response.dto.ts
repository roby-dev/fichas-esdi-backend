import { ApiProperty } from '@nestjs/swagger';
import { Committee } from 'src/domain/entities/committe.entity';

export class CommitteeResponseDto {
  @ApiProperty({ example: '64ee123abcde4567f8901234' })
  id: string;

  @ApiProperty({ example: '737' })
  committeeId: string;

  @ApiProperty({ example: 'LAS BUGANVILLAS' })
  name: string;

  static fromDomain(committee: Committee): CommitteeResponseDto {
    return {
      id: committee.id!,
      committeeId: committee.committeeId,
      name: committee.name,
    };
  }
}
