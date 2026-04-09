import { Controller, Get, Post, Patch, Delete, Body, Req, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationStatusDto } from './dto/update-collaboration-status.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { FilterCollaborationsDto } from './dto/filter-collaborations.dto';
import { FilterMyInfluencersDto } from './dto/filter-my-influencers.dto';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { CollaborationStatus, UserRole } from '../../database/entities/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';

@ApiTags('Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.INFLUENCER, UserRole.ADMIN)
@Controller('v1/collaboration')
export class CollaborationController {
    constructor(private readonly collaborationService: CollaborationService) { }

    @Post()
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Request a new collaboration' })
    @ApiCreatedResponse({ description: 'Collaboration request created', type: Collaboration })
    async create(@Req() req: any, @Body() createDto: CreateCollaborationDto) {
        return this.collaborationService.createCollaboration(req.user.id, createDto);
    }

    @Get('my-influencers')
    @ApiOperation({ summary: 'Get influencers I have collaborated with' })
    @ApiOkResponse({ description: 'Returns a list of influencers with collaboration stats' })
    async getMyInfluencers(@Req() req: any, @Query() filters: FilterMyInfluencersDto) {
        return this.collaborationService.getMyInfluencers(req.user.id, filters);
    }

    @Get()
    @ApiOperation({ summary: 'List collaborations for current user' })
    @ApiOkResponse({ description: 'Returns a list of collaborations', type: Collaboration, isArray: true })
    @ApiQuery({ name: 'status', enum: CollaborationStatus, required: false })
    @ApiQuery({ name: 'search', required: false, description: 'Search by title' })
    async findAll(@Req() req: any, @Query() filters: FilterCollaborationsDto) {
        return this.collaborationService.getMyCollaborations(req.user.id, filters);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get collaboration details' })
    @ApiOkResponse({ description: 'Returns collaboration details', type: Collaboration })
    async findOne(@Req() req: any, @Param('id') id: string) {
        return this.collaborationService.getCollaborationById(id, req.user.id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update collaboration status' })
    @ApiOkResponse({ description: 'Collaboration status updated', type: Collaboration })
    async updateStatus(@Req() req: any, @Param('id') id: string, @Body() statusDto: UpdateCollaborationStatusDto) {
        return this.collaborationService.updateStatus(id, req.user.id, statusDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update collaboration details' })
    @ApiOkResponse({ description: 'Collaboration details updated', type: Collaboration })
    async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateCollaborationDto) {
        return this.collaborationService.updateCollaboration(id, req.user.id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a collaboration' })
    @ApiOkResponse({ description: 'Collaboration deleted' })
    async remove(@Req() req: any, @Param('id') id: string) {
        return this.collaborationService.deleteCollaboration(id, req.user.id);
    }
}
