import { Controller, Get, Param, Post, Body, Delete, Query } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { Attachment } from '../../database/entities/attachment.entity';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiNotFoundResponse, ApiQuery } from '@nestjs/swagger';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import {
  ApiCreatedResponseEnvelope,
  ApiOkResponseEnvelope,
  EmptyResponseDto,
} from '../../core/swagger/response-envelope';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';

@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly service: AttachmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all attachments' })
  @ApiQuery({ name: 'ownerType', required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiOkResponseEnvelope(Attachment, true)
  findAll(
    @Query('ownerType') ownerType?: string,
    @Query('ownerId') ownerId?: string,
    @Query() pagination: PaginationQueryDto = new PaginationQueryDto(),
  ) {
    const { page, limit } = pagination;
    if (ownerType && ownerId) {
      return this.service.findByOwner(ownerType, ownerId, page, limit);
    }
    return this.service.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment by ID' })
  @ApiOkResponseEnvelope(Attachment)
  @ApiNotFoundResponse({ description: 'Attachment not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new attachment' })
  @ApiCreatedResponseEnvelope(Attachment)
  create(@Body() dto: CreateAttachmentDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiOkResponseEnvelope(EmptyResponseDto)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
