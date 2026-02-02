import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { VerificationStatus } from '../../../database/entities/enums';

export class UpdateVerificationStatusDto {
    @ApiProperty({ enum: VerificationStatus, example: VerificationStatus.APPROVED })
    @IsNotEmpty()
    @IsEnum(VerificationStatus)
    status: VerificationStatus;
}
