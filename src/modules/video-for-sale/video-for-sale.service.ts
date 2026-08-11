import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { VideoForSale } from "../../database/entities/video-for-sale.entity";
import { CreateVideoForSaleDto } from "./dto/create-video-for-sale.dto";
import { UpdateVideoForSaleDto } from "./dto/update-video-for-sale.dto";
import { SearchVideosForSaleDto } from "./dto/search-videos-for-sale.dto";
import {
  KCSettingService,
  KCSettingKey,
} from "../kc-setting/kc-setting.service";
import { WalletService } from "../kc-wallet/wallet.service";
import { TransactionPurpose } from "../../database/entities/enums";

@Injectable()
export class VideoForSaleService {
  constructor(
    @InjectRepository(VideoForSale)
    private readonly videoRepo: Repository<VideoForSale>,
    private readonly settingService: KCSettingService,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    createDto: CreateVideoForSaleDto,
  ): Promise<VideoForSale> {
    const fee = await this.settingService.getSetting(KCSettingKey.VIDEO_PRICE);

    return await this.dataSource.transaction(async (manager) => {
      // Debit coins
      await this.walletService.debit(
        userId,
        fee,
        TransactionPurpose.VIDEO_UPLOAD,
        { title: createDto.title },
        manager,
      );

      // Create video for sale
      const video = this.videoRepo.create({
        influencer: { id: userId } as any,
        ...createDto,
      });

      const videoRepo = manager.getRepository(VideoForSale);
      return await videoRepo.save(video);
    });
  }

  async findAll(searchDto: SearchVideosForSaleDto) {
    const {
      search,
      minPrice,
      maxPrice,
      categories,
      influencerId,
      page = 1,
      limit = 20,
    } = searchDto;
    const query = this.videoRepo
      .createQueryBuilder("video")
      .leftJoinAndSelect("video.influencer", "influencer")
      .leftJoinAndSelect("influencer.influencerProfile", "influencerProfile")
      .leftJoinAndSelect("influencer.profile", "profile");

    if (search) {
      query.andWhere(
        "(video.title ILIKE :search OR video.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (minPrice !== undefined && minPrice !== null) {
      query.andWhere("video.price >= :minPrice", { minPrice });
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      query.andWhere("video.price <= :maxPrice", { maxPrice });
    }

    if (influencerId) {
      query.andWhere("video.influencerId = :influencerId", { influencerId });
    }

    if (categories && categories.length > 0) {
      // Check if any of the categories match
      query.andWhere("video.categories && :categories", { categories });
    }

    query.orderBy("video.createdAt", "DESC");

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

  async findMyVideos(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.videoRepo.findAndCount({
      where: { influencer: { id: userId } },
      order: { createdAt: "DESC" },
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

  async findOne(id: string): Promise<VideoForSale> {
    const video = await this.videoRepo.findOne({
      where: { id },
      relations: [
        "influencer",
        "influencer.influencerProfile",
        "influencer.profile",
      ],
    });

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    return video;
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateVideoForSaleDto,
  ): Promise<VideoForSale> {
    const video = await this.findOne(id);

    if (video.influencer.id !== userId) {
      throw new ForbiddenException("You do not own this video");
    }

    Object.assign(video, updateDto);
    return this.videoRepo.save(video);
  }

  async remove(userId: string, userRole: string, id: string): Promise<void> {
    const video = await this.findOne(id);

    if (userRole !== "ADMIN" && video.influencer.id !== userId) {
      throw new ForbiddenException(
        "You do not have permission to delete this video",
      );
    }

    await this.videoRepo.softDelete(id);
  }
}
