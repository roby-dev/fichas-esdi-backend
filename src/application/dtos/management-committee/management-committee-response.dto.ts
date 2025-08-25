import { ApiProperty } from '@nestjs/swagger';
import { ManagementCommittee } from 'src/domain/entities/management-committe.entity';
import { UserResponseDto } from '../user/user-response.dto';

export class ManagementCommitteeResponseDto {
  @ApiProperty({ example: '64ee123abcde4567f8901234' })
  id: string;

  @ApiProperty({ example: '737' })
  committeeId: string;

  @ApiProperty({ example: 'LAS BUGANVILLAS' })
  name: string;

  @ApiProperty()
  user?: UserResponseDto | undefined;

  static fromDomain(
    managementCommittee: ManagementCommittee,
  ): ManagementCommitteeResponseDto {
    return {
      id: managementCommittee.id!,
      committeeId: managementCommittee.committeeId,
      name: managementCommittee.name,
      user: managementCommittee.user
        ? UserResponseDto.fromDomain(managementCommittee.user)
        : undefined,
    };
  }
}
