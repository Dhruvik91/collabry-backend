import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { CollaborationStatus } from '../../../database/entities/enums';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';

export class FilterCollaborationsDto extends PaginationQueryDto {
    @ApiPropertyOptional({ enum: CollaborationStatus, description: 'Filter by collaboration status' })
    @IsOptional()
    @IsEnum(CollaborationStatus)
    status?: CollaborationStatus;

    @ApiPropertyOptional({ description: 'Search by title (partial match)' })
    @IsOptional()
    @IsString()
    search?: string;
}
