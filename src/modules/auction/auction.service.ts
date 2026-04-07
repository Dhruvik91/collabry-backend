import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auction } from '../../database/entities/auction.entity';
import { Bid } from '../../database/entities/bid.entity';
import { User } from '../../database/entities/user.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { AuctionStatus, BidStatus, UserRole, CollaborationStatus } from '../../database/entities/enums';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class AuctionService {
    constructor(
        @InjectRepository(Auction)
        private auctionRepository: Repository<Auction>,
        @InjectRepository(Bid)
        private bidRepository: Repository<Bid>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Collaboration)
        private collaborationRepository: Repository<Collaboration>,
    ) {}

    async createAuction(createAuctionDto: CreateAuctionDto, userId: string): Promise<Auction> {
        const creator = await this.userRepository.findOneBy({ id: userId });
        if (!creator) throw new NotFoundException('User not found');

        if (creator.role !== UserRole.USER && creator.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only brands can create auctions');
        }

        const auction = this.auctionRepository.create({
            ...createAuctionDto,
            creator,
            status: AuctionStatus.OPEN,
        });

        return this.auctionRepository.save(auction);
    }

    async findAll(filters: { status?: AuctionStatus; category?: string; page?: number; limit?: number }): Promise<any> {
        const { page = 1, limit = 10, status, category } = filters;
        const query = this.auctionRepository.createQueryBuilder('auction')
            .leftJoinAndSelect('auction.creator', 'creator')
            .leftJoinAndSelect('creator.profile', 'profile');

        if (status) {
            query.andWhere('auction.status = :status', { status });
        } else {
            query.andWhere('auction.status = :status', { status: AuctionStatus.OPEN });
        }

        if (category) {
            query.andWhere('auction.category = :category', { category });
        }

        const [items, total] = await query
            .orderBy('auction.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<Auction> {
        const auction = await this.auctionRepository.findOne({
            where: { id },
            relations: ['creator', 'creator.profile', 'bids', 'bids.influencer', 'bids.influencer.profile', 'bids.influencer.influencerProfile'],
        });

        if (!auction) {
            throw new NotFoundException(`Auction with ID ${id} not found`);
        }

        return auction;
    }

    async updateAuction(id: string, updateAuctionDto: UpdateAuctionDto, userId: string): Promise<Auction> {
        const auction = await this.findOne(id);

        if (auction.creator.id !== userId) {
            throw new ForbiddenException('You can only update your own auctions');
        }

        Object.assign(auction, updateAuctionDto);
        return this.auctionRepository.save(auction);
    }

    async removeAuction(id: string, userId: string): Promise<void> {
        const auction = await this.findOne(id);

        if (auction.creator.id !== userId) {
            throw new ForbiddenException('You can only delete your own auctions');
        }

        await this.auctionRepository.remove(auction);
    }

    async placeBid(auctionId: string, createBidDto: CreateBidDto, userId: string): Promise<Bid> {
        const influencer = await this.userRepository.findOneBy({ id: userId });
        if (!influencer) throw new NotFoundException('Influencer not found');

        if (influencer.role !== UserRole.INFLUENCER) {
            throw new ForbiddenException('Only influencers can place bids');
        }

        const auction = await this.findOne(auctionId);

        if (auction.status !== AuctionStatus.OPEN) {
            throw new BadRequestException('Bidding is closed for this auction');
        }

        if (new Date() > new Date(auction.deadline)) {
            throw new BadRequestException('Auction deadline has passed');
        }

        const existingBid = await this.bidRepository.findOne({
            where: { auction: { id: auctionId }, influencer: { id: influencer.id } },
        });

        if (existingBid) {
            throw new BadRequestException('You have already placed a bid on this auction');
        }

        const bid = this.bidRepository.create({
            ...createBidDto,
            auction,
            influencer,
            status: BidStatus.PENDING,
        });

        return this.bidRepository.save(bid);
    }

    async acceptBid(bidId: string, brandId: string): Promise<any> {
        const bid = await this.bidRepository.findOne({
            where: { id: bidId },
            relations: ['auction', 'auction.creator', 'influencer'],
        });

        if (!bid) {
            throw new NotFoundException(`Bid with ID ${bidId} not found`);
        }

        if (bid.auction.creator.id !== brandId) {
            throw new ForbiddenException('You can only accept bids for your own auctions');
        }

        if (bid.auction.status !== AuctionStatus.OPEN) {
            throw new BadRequestException('This auction is no longer open');
        }

        // 1. Mark bid as accepted
        bid.status = BidStatus.ACCEPTED;
        await this.bidRepository.save(bid);

        // 2. Mark auction as completed
        bid.auction.status = AuctionStatus.COMPLETED;
        await this.auctionRepository.save(bid.auction);

        // 3. Reject all other bids
        await this.bidRepository.createQueryBuilder()
            .update(Bid)
            .set({ status: BidStatus.REJECTED })
            .where('auctionId = :auctionId AND id != :bidId', { auctionId: bid.auction.id, bidId })
            .execute();

        // 4. Create collaboration
        const influencerProfileRepo = this.userRepository.manager.getRepository(InfluencerProfile);
        const influencerProfile = await influencerProfileRepo.findOne({
            where: { user: { id: bid.influencer.id } }
        });

        const collaboration = this.collaborationRepository.create({
            requester: bid.auction.creator,
            influencer: influencerProfile,
            title: bid.auction.title,
            description: bid.auction.description,
            status: CollaborationStatus.ACCEPTED,
            proposedTerms: {
                bidAmount: bid.amount,
                proposal: bid.proposal,
            },
            agreedTerms: {
                bidAmount: bid.amount,
                proposal: bid.proposal,
            },
            startDate: new Date(),
            endDate: bid.auction.deadline,
        });

        await this.collaborationRepository.save(collaboration);
        
        return { message: 'Bid accepted and collaboration created', bid, collaborationId: collaboration.id };
    }

    async rejectBid(bidId: string, brandId: string): Promise<any> {
        const bid = await this.bidRepository.findOne({
            where: { id: bidId },
            relations: ['auction', 'auction.creator'],
        });

        if (!bid) {
            throw new NotFoundException(`Bid with ID ${bidId} not found`);
        }

        if (bid.auction.creator.id !== brandId) {
            throw new ForbiddenException('You can only reject bids for your own auctions');
        }

        if (bid.status !== BidStatus.PENDING) {
            throw new BadRequestException('Only pending bids can be rejected');
        }

        bid.status = BidStatus.REJECTED;
        await this.bidRepository.save(bid);

        return { message: 'Bid rejected successfully', bid };
    }

    async findMyBids(influencerId: string, page = 1, limit = 10): Promise<any> {
        const [items, total] = await this.bidRepository.findAndCount({
            where: { influencer: { id: influencerId } },
            relations: ['auction', 'auction.creator', 'auction.creator.profile'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findMyAuctions(userId: string, page = 1, limit = 10): Promise<any> {
        const [items, total] = await this.auctionRepository.findAndCount({
            where: { creator: { id: userId } },
            relations: ['creator', 'creator.profile', 'bids', 'bids.influencer', 'bids.influencer.profile'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
