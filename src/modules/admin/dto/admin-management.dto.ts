import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus, PaymentStatus } from '../../../database/entities/enums';

export enum DateRangeType {
    TODAY = 'TODAY',
    THIS_WEEK = 'THIS_WEEK',
    THIS_MONTH = 'THIS_MONTH',
    LAST_MONTH = 'LAST_MONTH',
    THIS_YEAR = 'THIS_YEAR',
    LAST_YEAR = 'LAST_YEAR',
    CUSTOM = 'CUSTOM',
}

export class PaginationDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class AdminOrderFilterDto extends PaginationDto {
    @ApiPropertyOptional({ enum: PaymentStatus })
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    planId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export class AdminUserFilterDto extends PaginationDto {
    @ApiPropertyOptional({ enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ enum: UserStatus })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export class AdminBulkStatusDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    userIds: string[];

    @ApiProperty({ enum: UserStatus })
    @IsEnum(UserStatus)
    status: UserStatus;
}

export class AdminUpdateVerificationDto {
    @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
    @IsEnum(['APPROVE', 'REJECT'])
    action: 'APPROVE' | 'REJECT';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    adminNotes?: string;
}

export class AdminFinanceFilterDto {
    @ApiProperty({ enum: DateRangeType })
    @IsEnum(DateRangeType)
    range: DateRangeType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
