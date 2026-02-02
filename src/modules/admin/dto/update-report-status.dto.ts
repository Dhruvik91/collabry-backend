import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { ReportStatus } from '../../../database/entities/enums';

export class UpdateReportStatusDto {
    @ApiProperty({ enum: ReportStatus, example: ReportStatus.RESOLVED })
    @IsNotEmpty()
    @IsEnum(ReportStatus)
    status: ReportStatus;
}
