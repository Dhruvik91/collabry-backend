import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'uuid-of-target-user' })
  @IsNotEmpty()
  @IsUUID()
  targetUserId: string;

  @ApiProperty({ example: 'Inappropriate content' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'User is posting spam links in messages.' })
  @IsOptional()
  @IsString()
  description?: string;
}
