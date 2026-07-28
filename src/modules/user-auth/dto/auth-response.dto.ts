import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../../database/entities/user.entity";

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: () => User })
  user: User;
}

export class VerifyEmailResponseDto extends AuthResponseDto {
  @ApiProperty()
  message: string;
}
