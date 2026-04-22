import { Controller, Post, Get, Body, Req, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
    ApiOkResponseEnvelope,
    ApiCreatedResponseEnvelope,
    ApiUnauthorizedResponseEnvelope,
    ApiForbiddenResponseEnvelope,
    ApiNotFoundResponseEnvelope,
} from '../../core/swagger/response-envelope';
import { SuccessResponseDto } from '../../core/dto/message-response.dto';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/enums';
import { Review } from '../../database/entities/review.entity';

@ApiTags('Review')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/review')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.ADMIN)
    @Post()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Create a review for an influencer' })
    @ApiCreatedResponseEnvelope(Review)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('You do not have permission to leave a review for this influencer')
    async create(@Req() req: any, @Body() createDto: CreateReviewDto) {
        return this.reviewService.createReview(req.user.id, createDto);
    }

    @AllowUnauthorized()
    @Get('influencer/:influencerId')
    @ApiOperation({ summary: 'Get all reviews for a specific influencer' })
    @ApiOkResponseEnvelope(Review, true)
    @ApiNotFoundResponseEnvelope('Influencer not found')
    async findForInfluencer(@Param('influencerId') influencerId: string) {
        return this.reviewService.getInfluencerReviews(influencerId);
    }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.ADMIN)
    @Post(':id')
    @ApiOperation({ summary: 'Update a review' })
    @ApiOkResponseEnvelope(Review)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('You do not have permission to update this review')
    @ApiNotFoundResponseEnvelope('Review not found')
    async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateReviewDto) {
        return this.reviewService.updateReview(req.user.id, id, updateDto);
    }

    @ApiBearerAuth()
    @Roles(UserRole.USER, UserRole.ADMIN)
    @Post(':id/delete')
    @ApiOperation({ summary: 'Delete a review' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('You do not have permission to delete this review')
    @ApiNotFoundResponseEnvelope('Review not found')
    async delete(@Req() req: any, @Param('id') id: string) {
        await this.reviewService.deleteReview(req.user.id, id);
        return { success: true };
    }
}
