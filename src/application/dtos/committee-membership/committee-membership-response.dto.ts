import { ApiProperty } from '@nestjs/swagger';
import { CommitteeMembership } from 'src/domain/entities/committee-membership.entity';
import { CommitteeResponseDto } from '../committee/committee-response.dto';
import { UserResponseDto } from '../user/user-response.dto';

export class CommitteeMembershipResponseDto {
  @ApiProperty({ example: '64ee123abcde4567f8901234' })
  id: string;

  @ApiProperty({ example: '64ee123abcde4567f8901234' })
  committeeRef: string;

  @ApiProperty({ example: '688f81da182ea76a2df99b07' })
  userRef: string;

  @ApiProperty({ required: false })
  committee?: CommitteeResponseDto;

  @ApiProperty({ required: false })
  user?: UserResponseDto;

  static fromDomain(
    membership: CommitteeMembership,
  ): CommitteeMembershipResponseDto {
    return {
      id: membership.id!,
      committeeRef: membership.committeeRef,
      userRef: membership.userRef,
      committee: membership.committee
        ? CommitteeResponseDto.fromDomain(membership.committee)
        : undefined,
      user: membership.user
        ? UserResponseDto.fromDomain(membership.user)
        : undefined,
    };
  }
}
