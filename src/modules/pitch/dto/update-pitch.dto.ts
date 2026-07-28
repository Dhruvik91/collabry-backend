import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { PitchStatus } from "../../../database/entities/enums";

export class UpdatePitchDto {
  @ApiProperty({ enum: PitchStatus })
  @IsNotEmpty()
  @IsEnum(PitchStatus)
  status: PitchStatus;
}
