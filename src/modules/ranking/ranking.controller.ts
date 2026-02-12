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
    ApiOkResponse,
    ApiParam,
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RankingService } from './ranking.service';
import { RankingBreakdownDto } from './dto/ranking-breakdown.dto';
import { UpdateRankingWeightsDto } from './dto/update-ranking-weights.dto';
import { RankingWeightsDto } from './dto/ranking-weights.dto';
import { UserRole } from '../../database/entities/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/Guards/roles.guard';

@ApiTags('Ranking')
@Controller('v1/ranking')
export class RankingController {
    constructor(private readonly rankingService: RankingService) { }

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
    @ApiOkResponse({
        description: 'Ranking breakdown retrieved successfully',
        type: RankingBreakdownDto,
    })
    @ApiNotFoundResponse({ description: 'Influencer not found' })
    async getRankingBreakdown(
        @Param('influencerId') influencerId: string
    ): Promise<RankingBreakdownDto> {
        return this.rankingService.getRankingBreakdown(influencerId);
    }

    @Post('recalculate/:influencerId')
    @UseGuards(RolesGuard)
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
    @ApiOkResponse({ description: 'Ranking recalculated successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
    @ApiNotFoundResponse({ description: 'Influencer not found' })
    async recalculateRanking(@Param('influencerId') influencerId: string) {
        const profile = await this.rankingService.updateRanking(influencerId);
        return {
            message: 'Ranking recalculated successfully',
            influencerId,
            newScore: profile.rankingScore,
        };
    }

    @Post('recalculate-all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Recalculate rankings for all influencers (Admin only)',
        description: 'Triggers ranking recalculation for all influencers in the system',
    })
    @ApiOkResponse({ description: 'Ranking recalculation started' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
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

    @Get('weights')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get current ranking weights (Admin only)',
        description: 'Returns the current weight configuration used for ranking calculations',
    })
    @ApiOkResponse({ description: 'Ranking weights retrieved successfully', type: RankingWeightsDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
    async getWeights(): Promise<RankingWeightsDto> {
        return this.rankingService.getWeights();
    }

    @Patch('weights')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update ranking weights (Admin only)',
        description: 'Updates the weight configuration used for ranking calculations',
    })
    @ApiOkResponse({ description: 'Ranking weights updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid weight values' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
    async updateWeights(@Body() updateDto: UpdateRankingWeightsDto) {
        this.rankingService.updateWeights(updateDto);
        return {
            message: 'Ranking weights updated successfully',
            weights: this.rankingService.getWeights(),
        };
    }
}
