import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
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
import { AuctionService } from './auction.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AuctionStatus } from '../../database/entities/enums';
import { AuctionQueryDto } from './dto/auction-query.dto';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';
import { Auction } from '../../database/entities/auction.entity';
import { Bid } from '../../database/entities/bid.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';

@ApiTags('Auctions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/auctions')
export class AuctionController {
    constructor(private readonly auctionService: AuctionService) {}

    @Post()
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new auction (Brand only)' })
    @ApiCreatedResponseEnvelope(Auction)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only brands can create auctions')
    create(@Req() req: any, @Body() createAuctionDto: CreateAuctionDto) {
        return this.auctionService.createAuction(createAuctionDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List all open auctions' })
    @ApiOkResponseEnvelope(Auction, true)
    findAll(
        @Query() query: AuctionQueryDto
    ) {
        return this.auctionService.findAll(query);
    }

    @Get('my')
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all auctions created by the current user' })
    @ApiOkResponseEnvelope(Auction, true)
    @ApiUnauthorizedResponseEnvelope()
    findMyAuctions(
        @Req() req: any,
        @Query() query: AuctionQueryDto
    ) {
        return this.auctionService.findMyAuctions(req.user.id, query.page, query.limit, query.search);
    }

    @Get('my/bids')
    @Roles(UserRole.INFLUENCER)
    @ApiOperation({ summary: 'List all bids placed by the current influencer' })
    @ApiOkResponseEnvelope(Bid, true)
    @ApiUnauthorizedResponseEnvelope()
    findMyBids(
        @Req() req: any,
        @Query() query: AuctionQueryDto
    ) {
        return this.auctionService.findMyBids(req.user.id, query.page, query.limit, query.search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get auction details and bids' })
    @ApiOkResponseEnvelope(Auction)
    @ApiNotFoundResponseEnvelope('Auction not found')
    findOne(@Param('id') id: string) {
        return this.auctionService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update auction (Owner only)' })
    @ApiOkResponseEnvelope(Auction)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('You do not have permission to update this auction')
    @ApiNotFoundResponseEnvelope('Auction not found')
    update(@Param('id') id: string, @Body() updateAuctionDto: UpdateAuctionDto, @Req() req: any) {
        return this.auctionService.updateAuction(id, updateAuctionDto, req.user.id);
    }

    @Delete(':id')
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete auction (Owner only)' })
    @ApiOkResponseEnvelope(SuccessResponseDto)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('You do not have permission to delete this auction')
    @ApiNotFoundResponseEnvelope('Auction not found')
    async remove(@Param('id') id: string, @Req() req: any) {
        await this.auctionService.removeAuction(id, req.user.id);
        return { success: true };
    }

    @Post(':id/bids')
    @Throttle({ default: { limit: 20, ttl: 60000 } })
    @Roles(UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Place a bid on an auction (Influencer only)' })
    @ApiCreatedResponseEnvelope(Bid)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only influencers can place bids')
    @ApiNotFoundResponseEnvelope('Auction not found')
    placeBid(@Param('id') auctionId: string, @Body() createBidDto: CreateBidDto, @Req() req: any) {
        return this.auctionService.placeBid(auctionId, createBidDto, req.user.id);
    }

    @Post('bids/:id/accept')
    @Roles(UserRole.USER)
    @ApiOperation({ summary: 'Accept a bid and create collaboration (Brand only)' })
    @ApiOkResponseEnvelope(Collaboration)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only the auction creator can accept bids')
    @ApiNotFoundResponseEnvelope('Bid not found')
    acceptBid(@Param('id') bidId: string, @Req() req: any) {
        return this.auctionService.acceptBid(bidId, req.user.id);
    }

    @Post('bids/:id/reject')
    @Roles(UserRole.USER)
    @ApiOperation({ summary: 'Reject a bid (Brand only)' })
    @ApiOkResponseEnvelope(Bid)
    @ApiUnauthorizedResponseEnvelope()
    @ApiForbiddenResponseEnvelope('Only the auction creator can reject bids')
    @ApiNotFoundResponseEnvelope('Bid not found')
    rejectBid(@Param('id') bidId: string, @Req() req: any) {
        return this.auctionService.rejectBid(bidId, req.user.id);
    }
}
