import { ApiProperty } from '@nestjs/swagger';
import { Session } from 'src/domain/entities/session.entity';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: [String] })
  roles: string[];
}

export class SessionResponseDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ required: false })
  ipAddress?: string | string[];

  @ApiProperty({ required: false })
  userAgent?: string;

  @ApiProperty({ required: false, type: UserSummaryDto })
  user?: UserSummaryDto;

  static fromDomain(session: Session): SessionResponseDto {
    const user = session.user;
    return {
      id: session.id,
      userId: session.userId,
      tokenId: session.tokenId,
      active: session.active,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      user: user
        ? { id: user.id!, email: user.email, roles: user.roles }
        : undefined,
    };
  }
}
