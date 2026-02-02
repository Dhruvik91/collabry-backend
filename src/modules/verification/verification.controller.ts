import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';

@ApiTags('Verification')
@ApiBearerAuth()
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
