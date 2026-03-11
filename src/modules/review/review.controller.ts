import { Controller, Post, Get, Body, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';

@ApiTags('Review')
@Controller('v1/review')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a review for an influencer' })
    @ApiCreatedResponse({ description: 'Review created successfully' })
    async create(@Req() req: any, @Body() createDto: CreateReviewDto) {
        return this.reviewService.createReview(req.user.id, createDto);
    }

    @AllowUnauthorized()
    @Get('influencer/:influencerId')
    @ApiOperation({ summary: 'Get all reviews for a specific influencer' })
    @ApiOkResponse({ description: 'Returns a list of reviews' })
    async findForInfluencer(@Param('influencerId') influencerId: string) {
        return this.reviewService.getInfluencerReviews(influencerId);
    }

    @ApiBearerAuth()
    @Post(':id')
    @ApiOperation({ summary: 'Update a review' })
    @ApiOkResponse({ description: 'Review updated successfully' })
    async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateReviewDto) {
        return this.reviewService.updateReview(req.user.id, id, updateDto);
    }

    @ApiBearerAuth()
    @Post(':id/delete')
    @ApiOperation({ summary: 'Delete a review' })
    @ApiOkResponse({ description: 'Review deleted successfully' })
    async delete(@Req() req: any, @Param('id') id: string) {
        return this.reviewService.deleteReview(req.user.id, id);
    }
}
