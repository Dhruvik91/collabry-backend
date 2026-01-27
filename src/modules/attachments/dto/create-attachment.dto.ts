import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAttachmentDto {
  @ApiProperty({ description: 'Type of owner entity (user, job, application, organization)' })
  @IsString()
  ownerType: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId: string;

  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

  @ApiProperty({ required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  uploadedBy?: string;
}
