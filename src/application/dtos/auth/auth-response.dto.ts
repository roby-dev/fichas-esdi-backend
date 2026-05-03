import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ type: Boolean, default: false }) mustChangePassword: boolean;

  static create(
    accessToken: string,
    refreshToken: string,
    mustChangePassword = false,
  ) {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.mustChangePassword = mustChangePassword;

    return dto;
  }
}
