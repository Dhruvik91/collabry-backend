import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Auction } from "../../database/entities/auction.entity";
import { Bid } from "../../database/entities/bid.entity";
import { User } from "../../database/entities/user.entity";
import { Collaboration } from "../../database/entities/collaboration.entity";
import {
  AuctionStatus,
  BidStatus,
  UserRole,
  CollaborationStatus,
  UserStatus,
} from "../../database/entities/enums";
import { InfluencerProfile } from "../../database/entities/influencer-profile.entity";
import { CreateAuctionDto } from "./dto/create-auction.dto";
import { UpdateAuctionDto } from "./dto/update-auction.dto";
import { CreateBidDto } from "./dto/create-bid.dto";
import { SocketGateway } from "../socket/socket.gateway";
import { WalletService } from "../kc-wallet/wallet.service";
import {
  KCSettingService,
  KCSettingKey,
} from "../kc-setting/kc-setting.service";
import { TransactionPurpose } from "../../database/entities/enums";
import { AppMailerService } from "../mailer/mailer.service";

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name);

  constructor(
    @InjectRepository(Auction)
    private auctionRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Collaboration)
    private collaborationRepository: Repository<Collaboration>,
    private socketGateway: SocketGateway,
    private walletService: WalletService,
    private settingService: KCSettingService,
    private mailerService: AppMailerService,
  ) {}

  async createAuction(
    createAuctionDto: CreateAuctionDto,
    userId: string,
  ): Promise<Auction> {
    const creator = await this.userRepository.findOneBy({ id: userId });
    if (!creator) throw new NotFoundException("User not found");

    if (creator.role !== UserRole.USER && creator.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only brands can create auctions");
    }

    if (creator.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        "Your account must be active to create auctions",
      );
    }

    const savedAuction = await this.auctionRepository.manager.transaction(
      async (manager) => {
        const auction = this.auctionRepository.create({
          ...createAuctionDto,
          creator,
          status: AuctionStatus.OPEN,
        });

        const saved = await manager.save(auction);

        // Deduct KC coins
        const price = await this.settingService.getSetting(
          KCSettingKey.AUCTION_CREATION_PRICE,
        );
        if (price > 0) {
          await this.walletService.debit(
            userId,
            price,
            TransactionPurpose.AUCTION_CREATION,
            { auctionId: saved.id },
            manager,
          );
        }
        return saved;
      },
    );

    // Reload with relations for WebSocket
    const fullAuction = await this.auctionRepository.findOne({
      where: { id: savedAuction.id },
      relations: ["creator", "creator.profile"],
    });

    // Emit auction created event to all users
    this.socketGateway.emitToAll(
      "auction_created",
      fullAuction || savedAuction,
    );

    return savedAuction;
  }

  async findAll(filters: {
    status?: AuctionStatus;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { page = 1, limit = 10, status, category, search } = filters;
    const query = this.auctionRepository
      .createQueryBuilder("auction")
      .innerJoinAndSelect("auction.creator", "creator")
      .leftJoinAndSelect("creator.profile", "profile")
      .leftJoinAndSelect("auction.bids", "bids"); // Include bids for count if needed

    if (status) {
      query.andWhere("auction.status = :status", { status });
    } else {
      query.andWhere("auction.status = :status", {
        status: AuctionStatus.OPEN,
      });
    }

    // Only show auctions from active users
    query.andWhere("creator.status = :userStatus", {
      userStatus: UserStatus.ACTIVE,
    });

    if (category) {
      query.andWhere("auction.category = :category", { category });
    }

    if (search) {
      query.andWhere(
        "(auction.title ILIKE :search OR auction.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const [items, total] = await query
      .orderBy("auction.createdAt", "DESC")
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
      relations: [
        "creator",
        "creator.profile",
        "bids",
        "bids.influencer",
        "bids.influencer.profile",
        "bids.influencer.influencerProfile",
      ],
    });

    if (!auction) {
      throw new NotFoundException(`Auction with ID ${id} not found`);
    }

    return auction;
  }

  async updateAuction(
    id: string,
    updateAuctionDto: UpdateAuctionDto,
    userId: string,
  ): Promise<Auction> {
    const auction = await this.findOne(id);

    if (auction.creator?.id && auction.creator.id !== userId) {
      throw new ForbiddenException("You can only update your own auctions");
    }

    Object.assign(auction, updateAuctionDto);
    const savedAuction = await this.auctionRepository.save(auction);

    // Emit auction updated event
    this.socketGateway.emitToAuction(id, "auction_updated", savedAuction);

    return savedAuction;
  }

  async removeAuction(id: string, userId: string): Promise<void> {
    const auction = await this.findOne(id);

    if (auction.creator?.id && auction.creator.id !== userId) {
      throw new ForbiddenException("You can only delete your own auctions");
    }

    // Use softRemove for historical data preservation
    await this.auctionRepository.softRemove(auction);

    // Emit auction deleted event
    this.socketGateway.emitToAuction(id, "auction_deleted", { auctionId: id });
  }

  async placeBid(
    auctionId: string,
    createBidDto: CreateBidDto,
    userId: string,
  ): Promise<Bid> {
    const influencer = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["profile", "influencerProfile"],
    });
    if (!influencer) throw new NotFoundException("Influencer not found");

    if (influencer.role !== UserRole.INFLUENCER) {
      throw new ForbiddenException("Only influencers can place bids");
    }

    if (influencer.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException("Your account must be active to place bids");
    }

    const auction = await this.findOne(auctionId);

    if (auction.status !== AuctionStatus.OPEN) {
      throw new BadRequestException("Bidding is closed for this auction");
    }

    if (auction.creator?.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        "This auction is no longer available as the creator account is not active",
      );
    }

    if (new Date() > new Date(auction.deadline)) {
      throw new BadRequestException("Auction deadline has passed");
    }

    const existingBid = await this.bidRepository.findOne({
      where: { auction: { id: auctionId }, influencer: { id: influencer.id } },
    });

    if (existingBid) {
      throw new BadRequestException(
        "You have already placed a bid on this auction",
      );
    }

    const savedBid = await this.bidRepository.manager.transaction(
      async (manager) => {
        const bid = this.bidRepository.create({
          ...createBidDto,
          auction,
          influencer,
          status: BidStatus.PENDING,
        });

        const saved = await manager.save(bid);

        // Deduct KC coins
        const price = await this.settingService.getSetting(
          KCSettingKey.BID_PLACEMENT_PRICE,
        );
        if (price > 0) {
          await this.walletService.debit(
            userId,
            price,
            TransactionPurpose.BID_PLACEMENT,
            { auctionId, bidId: saved.id },
            manager,
          );
        }
        return saved;
      },
    );

    // savedBid now contains the influencer with profile info from the initial fetch
    const bidToEmit = savedBid;

    // Emit new bid event to the auction room and the creator
    this.socketGateway.emitToAuction(auctionId, "new_bid", bidToEmit);
    if (auction.creator?.id) {
      this.socketGateway.emitToUser(
        auction.creator.id,
        "new_bid_notification",
        {
          auctionId,
          auctionTitle: auction.title,
          bid: bidToEmit,
        },
      );
    }

    return savedBid;
  }

  async acceptBid(bidId: string, brandId: string): Promise<any> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      relations: [
        "auction",
        "auction.creator",
        "auction.creator.profile",
        "influencer",
      ],
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${bidId} not found`);
    }

    if (bid.auction?.creator?.id && bid.auction.creator.id !== brandId) {
      throw new ForbiddenException(
        "You can only accept bids for your own auctions",
      );
    }

    if (bid.auction.status !== AuctionStatus.OPEN) {
      throw new BadRequestException("This auction is no longer open");
    }

    // Wrap entire bid acceptance process in a transaction
    const result = await this.bidRepository.manager.transaction(
      async (manager) => {
        // 1. Mark bid as accepted
        bid.status = BidStatus.ACCEPTED;
        await manager.save(bid);

        // 2. Mark auction as completed
        bid.auction.status = AuctionStatus.COMPLETED;
        await manager.save(bid.auction);

        // 3. Reject all other bids for this auction
        await manager
          .createQueryBuilder()
          .update(Bid)
          .set({ status: BidStatus.REJECTED })
          .where("auctionId = :auctionId AND id != :bidId", {
            auctionId: bid.auction.id,
            bidId,
          })
          .execute();

        // 4. Create collaboration
        const influencerProfileRepo = manager.getRepository(InfluencerProfile);
        if (!bid.influencer?.id) {
          throw new BadRequestException("Influencer no longer exists");
        }
        const influencerProfile = await influencerProfileRepo.findOne({
          where: { user: { id: bid.influencer.id } },
        });

        if (!influencerProfile) {
          throw new NotFoundException("Influencer profile not found");
        }

        const collabRepo = manager.getRepository(Collaboration);
        const collaboration = collabRepo.create({
          requester: { id: bid.auction.creator?.id || brandId } as any,
          influencer: { id: influencerProfile.id } as any,
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

        const savedCollab = await manager.save(collaboration);

        return { collaborationId: savedCollab.id };
      },
    );

    // Emit bid accepted and auction completed events (Outside transaction for performance)
    if (bid.auction?.id && bid.influencer?.id) {
      this.socketGateway.emitToAuction(bid.auction.id, "bid_accepted", {
        bidId,
        influencerId: bid.influencer.id,
      });
      this.socketGateway.emitToAuction(bid.auction.id, "auction_completed", {
        auctionId: bid.auction.id,
        winnerId: bid.influencer.id,
      });
      this.socketGateway.emitToUser(
        bid.influencer.id,
        "bid_accepted_notification",
        {
          auctionId: bid.auction.id,
          auctionTitle: bid.auction.title,
          bidAmount: bid.amount,
        },
      );
    }

    // Send email notification to influencer
    if (bid.influencer?.email && bid.auction) {
      this.mailerService
        .sendBidAcceptedEmail(
          bid.influencer.email,
          bid.auction.title,
          bid.amount,
          bid.auction.creator?.profile?.fullName ||
            bid.auction.creator?.username ||
            "A Brand",
        )
        .catch((err) =>
          this.logger.error(
            `Failed to send bid acceptance email to ${bid.influencer?.email}`,
            err,
          ),
        );
    }

    return {
      message: "Bid accepted and collaboration created",
      bid,
      collaborationId: result.collaborationId,
    };
  }

  async rejectBid(bidId: string, brandId: string): Promise<any> {
    const bid = await this.bidRepository.findOne({
      where: { id: bidId },
      relations: ["auction", "auction.creator", "influencer"],
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${bidId} not found`);
    }

    if (bid.auction?.creator?.id && bid.auction.creator.id !== brandId) {
      throw new ForbiddenException(
        "You can only reject bids for your own auctions",
      );
    }

    if (bid.status === BidStatus.REJECTED) {
      return { message: "Bid rejected successfully", bid };
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException("Only pending bids can be rejected");
    }

    bid.status = BidStatus.REJECTED;
    await this.bidRepository.save(bid);

    // Emit bid rejected event
    if (bid.influencer?.id && bid.auction) {
      this.socketGateway.emitToUser(bid.influencer.id, "bid_rejected", {
        auctionId: bid.auction.id,
        auctionTitle: bid.auction.title,
        bidId,
      });
    }

    return { message: "Bid rejected successfully", bid };
  }

  async findMyBids(
    influencerId: string,
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<any> {
    const query = this.bidRepository
      .createQueryBuilder("bid")
      .leftJoinAndSelect("bid.auction", "auction")
      .innerJoinAndSelect("auction.creator", "creator")
      .leftJoinAndSelect("creator.profile", "profile")
      .where("bid.influencerId = :influencerId", { influencerId })
      .orderBy("bid.createdAt", "DESC");

    if (search) {
      query.andWhere(
        "(auction.title ILIKE :search OR auction.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const [items, total] = await query
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

  async findMyAuctions(
    userId: string,
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<any> {
    const query = this.auctionRepository
      .createQueryBuilder("auction")
      .innerJoinAndSelect("auction.creator", "creator")
      .leftJoinAndSelect("creator.profile", "profile")
      .leftJoinAndSelect("auction.bids", "bids")
      .leftJoinAndSelect("bids.influencer", "influencer")
      .leftJoinAndSelect("influencer.profile", "influencerProfile")
      .where("auction.creatorId = :userId", { userId })
      .orderBy("auction.createdAt", "DESC");

    if (search) {
      query.andWhere(
        "(auction.title ILIKE :search OR auction.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const [items, total] = await query
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
}
