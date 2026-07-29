import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { UserStatus } from "../../../database/entities/enums";

export class UserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}
