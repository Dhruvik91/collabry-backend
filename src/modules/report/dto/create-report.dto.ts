import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateReportDto {
  @ApiPropertyOptional({ example: 'uuid-of-target-user' })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiProperty({ example: 'uuid-of-target' })
  @IsNotEmpty()
  @IsUUID()
  targetId: string;

  @ApiProperty({ example: 'influencer', enum: ['influencer', 'review', 'user'] })
  @IsNotEmpty()
  @IsString()
  targetType: string;

  @ApiProperty({ example: 'Inappropriate content' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'User is posting spam links in messages.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Additional context' })
  @IsOptional()
  @IsString()
  details?: string;
}
