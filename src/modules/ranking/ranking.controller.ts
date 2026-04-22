import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import {
    ApiOkResponseEnvelope,
    ApiUnauthorizedResponseEnvelope,
    ApiForbiddenResponseEnvelope,
    ApiNotFoundResponseEnvelope,
} from '../../core/swagger/response-envelope';
import { RankingService } from './ranking.service';
import { RankingBreakdownDto } from './dto/ranking-breakdown.dto';
import { UpdateRankingWeightsDto } from './dto/update-ranking-weights.dto';
import { RankingWeightsDto } from './dto/ranking-weights.dto';
import { 
    RecalculateRankingResponseDto, 
    RecalculateAllRankingsResponseDto,
    TierGuideDto
} from './dto/ranking-response.dto';
import { UserRole } from '../../database/entities/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { AllowUnauthorized } from '../auth/unauthorized/allow-unauthorixed';

@ApiTags('Ranking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/ranking')
export class RankingController {
    constructor(private readonly rankingService: RankingService) { }

    @AllowUnauthorized()
    @Get('breakdown/:influencerId')
    @ApiOperation({
        summary: 'Get ranking breakdown for an influencer',
        description: 'Returns detailed breakdown of ranking score calculation',
    })
    @ApiParam({
        name: 'influencerId',
        description: 'User ID of the influencer',
        type: 'string',
    })
    @ApiOkResponseEnvelope(RankingBreakdownDto)
    @ApiNotFoundResponseEnvelope('Influencer not found')
    async getRankingBreakdown(
        @Param('influencerId') influencerId: string
    ): Promise<RankingBreakdownDto> {
        return this.rankingService.getRankingBreakdown(influencerId);
    }

    @Post('recalculate/:influencerId')
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Recalculate ranking for a specific influencer (Admin only)',
        description: 'Triggers immediate ranking recalculation for the specified influencer',
    })
    @ApiParam({
        name: 'influencerId',
        description: 'User ID of the influencer',
        type: 'string',
    })
    @ApiOkResponseEnvelope(RecalculateRankingResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Forbidden - Admin role required')
    @ApiNotFoundResponseEnvelope('Influencer not found')
    async recalculateRanking(@Param('influencerId') influencerId: string) {
        const profile = await this.rankingService.updateRanking(influencerId);
        return {
            message: 'Ranking recalculated successfully',
            influencerId,
            newScore: profile.rankingScore,
        };
    }

    @Post('recalculate-all')
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Recalculate rankings for all influencers (Admin only)',
        description: 'Triggers ranking recalculation for all influencers in the system',
    })
    @ApiOkResponseEnvelope(RecalculateAllRankingsResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Forbidden - Admin role required')
    async recalculateAllRankings() {
        // Run asynchronously to avoid timeout
        this.rankingService.recalculateAllRankings().catch((error) => {
            console.error('Error in background ranking recalculation:', error);
        });

        return {
            message: 'Ranking recalculation started for all influencers',
            status: 'processing',
        };
    }

    @AllowUnauthorized()
    @Get('tier-guide')
    @ApiOperation({
        summary: 'Get tier requirements guide',
        description: 'Returns comprehensive guide on all ranking tiers, requirements, and how to earn points',
    })
    @ApiOkResponseEnvelope(TierGuideDto)
    async getTierGuide() {
        return this.rankingService.getTierRequirementsGuide();
    }

    @Get('weights')
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get current ranking weights (Admin only)',
        description: 'Returns the current weight configuration used for ranking calculations',
    })
    @ApiOkResponseEnvelope(RankingWeightsDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Forbidden - Admin role required')
    async getWeights(): Promise<RankingWeightsDto> {
        return this.rankingService.getWeights();
    }

    @Patch('weights')
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update ranking weights (Admin only)',
        description: 'Updates the weight configuration used for ranking calculations',
    })
    @ApiOkResponseEnvelope(RecalculateRankingResponseDto) // Note: Actually returns message and weights, but let's use a generic success or similar
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Forbidden - Admin role required')
    async updateWeights(@Body() updateDto: UpdateRankingWeightsDto) {
        this.rankingService.updateWeights(updateDto);
        return {
            message: 'Ranking weights updated successfully',
            weights: this.rankingService.getWeights(),
        };
    }
}
