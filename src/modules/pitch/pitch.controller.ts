import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PitchService } from './pitch.service';
import { CreatePitchDto } from './dto/create-pitch.dto';
import { UpdatePitchDto } from './dto/update-pitch.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/enums';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';
import { Pitch } from '../../database/entities/pitch.entity';
import {
    ApiOkResponseEnvelope,
    ApiCreatedResponseEnvelope,
    ApiUnauthorizedResponseEnvelope,
    ApiForbiddenResponseEnvelope,
    ApiNotFoundResponseEnvelope,
} from '../../core/swagger/response-envelope';

@ApiTags('Pitches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/pitches')
export class PitchController {
    constructor(private readonly pitchService: PitchService) { }

    @Post()
    @Roles(UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Create a new pitch (Influencer only)' })
    @ApiCreatedResponseEnvelope(Pitch)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only influencers can create pitches')
    create(@Req() req: any, @Body() createPitchDto: CreatePitchDto) {
        return this.pitchService.createPitch(req.user.id, createPitchDto);
    }

    @Get('sent')
    @Roles(UserRole.INFLUENCER)
    @ApiOperation({ summary: 'List all pitches sent by the current influencer' })
    @ApiOkResponseEnvelope(Pitch, true)
    findSentPitches(
        @Req() req: any,
        @Query() query: PaginationQueryDto
    ) {
        return this.pitchService.getInfluencerPitches(req.user.id, query.page, query.limit);
    }

    @Get('received')
    @Roles(UserRole.USER)
    @ApiOperation({ summary: 'List all pitches received by the current brand/user' })
    @ApiOkResponseEnvelope(Pitch, true)
    findReceivedPitches(
        @Req() req: any,
        @Query() query: PaginationQueryDto
    ) {
        return this.pitchService.getTargetPitches(req.user.id, query.page, query.limit);
    }

    @Get('admin')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'List all pitches (Admin only)' })
    @ApiOkResponseEnvelope(Pitch, true)
    findAll(
        @Query() query: PaginationQueryDto
    ) {
        return this.pitchService.getAllPitches(query.page, query.limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get pitch details' })
    @ApiOkResponseEnvelope(Pitch)
    @ApiNotFoundResponseEnvelope('Pitch not found')
    findOne(@Param('id') id: string) {
        return this.pitchService.getPitchById(id);
    }

    @Patch(':id/status')
    @Roles(UserRole.USER)
    @ApiOperation({ summary: 'Update pitch status (Target only)' })
    @ApiOkResponseEnvelope(Pitch)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only the target user can update pitch status')
    @ApiNotFoundResponseEnvelope('Pitch not found')
    updateStatus(
        @Param('id') id: string,
        @Body() updatePitchDto: UpdatePitchDto,
        @Req() req: any
    ) {
        return this.pitchService.updatePitchStatus(req.user.id, id, updatePitchDto);
    }
}
