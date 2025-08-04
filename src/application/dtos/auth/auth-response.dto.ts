import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;

  static create(accessToken: string, refreshToken: string) {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;

    return dto;
  }
}
