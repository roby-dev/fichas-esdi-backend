import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshDto {
  @ApiProperty({
    description: 'RefreshToken',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
