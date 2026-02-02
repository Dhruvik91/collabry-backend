import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CollaborationStatus } from '../../../database/entities/enums';

export class UpdateCollaborationStatusDto {
    @ApiProperty({ enum: CollaborationStatus, example: CollaborationStatus.ACCEPTED })
    @IsEnum(CollaborationStatus)
    status: CollaborationStatus;
}
