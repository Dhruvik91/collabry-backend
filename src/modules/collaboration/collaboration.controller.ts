import { Controller, Get, Post, Patch, Body, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationStatusDto } from './dto/update-collaboration-status.dto';

@ApiTags('Collaboration')
@ApiBearerAuth()
@Controller('v1/collaboration')
export class CollaborationController {
    constructor(private readonly collaborationService: CollaborationService) { }

    @Post()
    @ApiOperation({ summary: 'Request a new collaboration' })
    @ApiCreatedResponse({ description: 'Collaboration request created' })
    async create(@Req() req: any, @Body() createDto: CreateCollaborationDto) {
        return this.collaborationService.createCollaboration(req.user.id, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List collaborations for current user' })
    @ApiOkResponse({ description: 'Returns a list of collaborations' })
    async findAll(@Req() req: any) {
        return this.collaborationService.getMyCollaborations(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get collaboration details' })
    @ApiOkResponse({ description: 'Returns collaboration details' })
    async findOne(@Req() req: any, @Param('id') id: string) {
        return this.collaborationService.getCollaborationById(id, req.user.id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update collaboration status' })
    @ApiOkResponse({ description: 'Collaboration status updated' })
    async updateStatus(@Req() req: any, @Param('id') id: string, @Body() statusDto: UpdateCollaborationStatusDto) {
        return this.collaborationService.updateStatus(id, req.user.id, statusDto);
    }
}
