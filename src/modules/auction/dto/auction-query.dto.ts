import { IsOptional, IsEnum, IsString } from 'class-validator';
import { AuctionStatus } from '../../../database/entities/enums';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';

export class AuctionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AuctionStatus)
  status?: AuctionStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
