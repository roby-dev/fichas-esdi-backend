import { ApiProperty } from '@nestjs/swagger';
import { Session } from 'src/domain/entities/session.entity';

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

  static fromDomain(session: Session): SessionResponseDto {
    return {
      id: session.id,
      userId: session.userId,
      tokenId: session.tokenId,
      active: session.active,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  }
}
