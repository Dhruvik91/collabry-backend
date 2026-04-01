import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuctionService } from './auction.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AuctionStatus } from '../../database/entities/enums';

@ApiTags('Auctions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/auctions')
export class AuctionController {
    constructor(private readonly auctionService: AuctionService) {}

    @Post()
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new auction (Brand only)' })
    create(@Req() req: any, @Body() createAuctionDto: CreateAuctionDto) {
        return this.auctionService.createAuction(createAuctionDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List all open auctions' })
    findAll(@Query('status') status?: AuctionStatus, @Query('category') category?: string) {
        return this.auctionService.findAll({ status, category });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get auction details and bids' })
    findOne(@Param('id') id: string) {
        return this.auctionService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update auction (Owner only)' })
    update(@Param('id') id: string, @Body() updateAuctionDto: UpdateAuctionDto, @Req() req: any) {
        return this.auctionService.updateAuction(id, updateAuctionDto, req.user.id);
    }

    @Delete(':id')
    @Roles(UserRole.USER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete auction (Owner only)' })
    remove(@Param('id') id: string, @Req() req: any) {
        return this.auctionService.removeAuction(id, req.user.id);
    }

    @Post(':id/bids')
    @Roles(UserRole.INFLUENCER)
    @ApiOperation({ summary: 'Place a bid on an auction (Influencer only)' })
    placeBid(@Param('id') auctionId: string, @Body() createBidDto: CreateBidDto, @Req() req: any) {
        return this.auctionService.placeBid(auctionId, createBidDto, req.user.id);
    }

    @Post('bids/:id/accept')
    @Roles(UserRole.USER)
    @ApiOperation({ summary: 'Accept a bid and create collaboration (Brand only)' })
    acceptBid(@Param('id') bidId: string, @Req() req: any) {
        return this.auctionService.acceptBid(bidId, req.user.id);
    }
}
