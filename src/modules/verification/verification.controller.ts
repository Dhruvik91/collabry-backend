import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/enums';

@ApiTags('Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INFLUENCER, UserRole.ADMIN)
@Controller('v1/verification')
export class VerificationController {
    constructor(private readonly verificationService: VerificationService) { }

    @Post('request')
    @ApiOperation({ summary: 'Submit a verification request' })
    @ApiCreatedResponse({ description: 'Verification request submitted' })
    async create(@Req() req: any, @Body() createDto: CreateVerificationRequestDto) {
        return this.verificationService.createRequest(req.user.id, createDto);
    }

    @Get('my-requests')
    @ApiOperation({ summary: 'Get my verification requests' })
    @ApiOkResponse({ description: 'Returns a list of verification requests' })
    async getMyRequests(@Req() req: any) {
        return this.verificationService.getMyRequests(req.user.id);
    }
}
