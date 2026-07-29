import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { InfluencerProfile } from "../../database/entities/influencer-profile.entity";
import { Collaboration } from "../../database/entities/collaboration.entity";
import { User } from "../../database/entities/user.entity";
import { Profile } from "../../database/entities/profile.entity";
import {
  UserRole,
  UserStatus,
  CollaborationStatus,
} from "../../database/entities/enums";
import { SaveInfluencerProfileDto } from "./dto/save-influencer-profile.dto";
import { SearchInfluencersDto } from "./dto/search-influencers.dto";
import { RankingService } from "../ranking/ranking.service";
import { isEntityNotFoundError } from "../../database/errors/entity-not-found.type-guard";
import { cif } from "../../database/errors/tryQuery";
import { slugify } from "../../core/utils/slugify";
import { ConflictException } from "@nestjs/common";

@Injectable()
export class InfluencerService {
  private readonly logger = new Logger(InfluencerService.name);

  constructor(
    @InjectRepository(InfluencerProfile)
    private readonly influencerRepo: Repository<InfluencerProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Collaboration)
    private readonly collaborationRepo: Repository<Collaboration>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly rankingService: RankingService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Count completed collaborations for an influencer profile
   */
  private async getCompletedCollaborationsCount(
    influencerProfileId: string,
  ): Promise<number> {
    return this.collaborationRepo.count({
      where: {
        influencer: { id: influencerProfileId },
        status: CollaborationStatus.COMPLETED,
      },
    });
  }

  async getInfluencerProfile(
    userId: string,
  ): Promise<InfluencerProfile & { completedCollaborations: number }> {
    try {
      const profile = await this.influencerRepo.findOne({
        where: { user: { id: userId } },
        relations: ["user"],
      });

      if (!profile) {
        throw new NotFoundException("Influencer profile not found");
      }

      const completedCollaborations =
        await this.getCompletedCollaborationsCount(profile.id);

      // Return profile with count
      return { ...profile, completedCollaborations };
    } catch (error) {
      cif(
        isEntityNotFoundError,
        new NotFoundException("Influencer profile not found"),
      )(error);
      throw error;
    }
  }

  async saveInfluencerProfile(
    userId: string,
    saveDto: SaveInfluencerProfileDto,
  ): Promise<InfluencerProfile & { completedCollaborations: number }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || user.role !== UserRole.INFLUENCER) {
      throw new ForbiddenException(
        "Only users with INFLUENCER role can have an influencer profile",
      );
    }

    // Update username if provided and different
    if (saveDto.username && saveDto.username !== user.username) {
      const usernameExists = await this.userRepo.findOne({
        where: { username: saveDto.username },
      });
      if (usernameExists) throw new ConflictException("Username already taken");
      user.username = saveDto.username;
      await this.userRepo.save(user);
    }

    let profile = await this.influencerRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      profile = this.influencerRepo.create({
        user: { id: userId } as any,
        ...saveDto,
      });
    } else {
      Object.assign(profile, saveDto);
    }

    // Generate slug if not provided or if name/username changed and no slug exists
    if (!profile.slug || (saveDto.fullName && !saveDto.slug)) {
      const baseForSlug =
        saveDto.username ||
        user.username ||
        saveDto.fullName ||
        `influencer-${userId.substring(0, 8)}`;
      let generatedSlug = slugify(baseForSlug);

      // Basic uniqueness check for slug
      const slugExists = await this.influencerRepo.findOne({
        where: { slug: generatedSlug },
      });
      if (slugExists && slugExists.id !== profile.id) {
        generatedSlug = `${generatedSlug}-${Math.floor(Math.random() * 1000)}`;
      }
      profile.slug = generatedSlug;
    } else if (saveDto.slug) {
      // If manual slug provided, check uniqueness
      const slugExists = await this.influencerRepo.findOne({
        where: { slug: saveDto.slug },
      });
      if (slugExists && slugExists.id !== profile.id) {
        throw new ConflictException("Profile slug already taken");
      }
      profile.slug = saveDto.slug;
    }

    // Calculate denormalized metrics if platforms are updated
    if (saveDto.platforms) {
      let totalFollowers = 0;
      let totalEngagement = 0;
      let platformCount = 0;

      for (const key in saveDto.platforms) {
        const platform = saveDto.platforms[key];
        if (platform.followers) totalFollowers += platform.followers;
        if (platform.engagementRate) {
          totalEngagement += platform.engagementRate;
          platformCount++;
        }
      }

      profile.totalFollowers = totalFollowers;
      profile.avgEngagementRate =
        platformCount > 0 ? totalEngagement / platformCount : 0;
    }

    await this.influencerRepo.save(profile);

    // Update ranking after profile changes
    try {
      await this.rankingService.updateRanking(userId);
    } catch (error) {
      this.logger.error(
        `Failed to update ranking after profile save for user ${userId}: ${error.message}`,
      );
    }

    // Reload the profile to include the user relation with updated username
    const reloadedProfile = await this.influencerRepo.findOne({
      where: { id: profile.id },
      relations: ["user"],
    });

    const completedCollaborations = await this.getCompletedCollaborationsCount(
      profile.id,
    );
    return { ...reloadedProfile, completedCollaborations } as any;
  }

  async searchInfluencers(
    searchDto: SearchInfluencersDto,
  ): Promise<{
    items: (InfluencerProfile & { completedCollaborations: number })[];
    meta: any;
  }> {
    const {
      categories,
      platform,
      minFollowers,
      maxFollowers,
      minEngagementRate,
      locationCountry,
      locationCity,
      gender,
      languages,
      priceMin,
      priceMax,
      audienceGender,
      page,
      limit,
      search,
      rankingTier,
      minRating,
      maxRating,
      verified,
    } = searchDto;
    const query = this.influencerRepo
      .createQueryBuilder("influencer")
      .innerJoinAndSelect("influencer.user", "user")
      .leftJoinAndSelect("user.profile", "profile")
      .where("user.role = :role", { role: UserRole.INFLUENCER })
      .andWhere("user.status = :status", { status: UserStatus.ACTIVE });

    if (search) {
      query.andWhere(
        "(influencer.fullName ILIKE :search OR influencer.bio ILIKE :search OR profile.bio ILIKE :search)",
        {
          search: `%${search}%`,
        },
      );
    }

    if (categories && categories.length > 0) {
      query.andWhere("influencer.categories && :categories", { categories });
    }

    if (platform) {
      // Using JSONB key existence operator for better performance
      query.andWhere("influencer.platforms ? :platform", { platform });
    }

    if (minFollowers !== undefined && minFollowers !== null) {
      query.andWhere("influencer.totalFollowers >= :minFollowers", {
        minFollowers,
      });
    }

    if (maxFollowers !== undefined && maxFollowers !== null) {
      query.andWhere("influencer.totalFollowers <= :maxFollowers", {
        maxFollowers,
      });
    }

    if (minEngagementRate !== undefined && minEngagementRate !== null) {
      query.andWhere("influencer.avgEngagementRate >= :minEngagementRate", {
        minEngagementRate,
      });
    }

    if (locationCountry) {
      query.andWhere("influencer.locationCountry ILIKE :locationCountry", {
        locationCountry: `%${locationCountry}%`,
      });
    }

    if (locationCity) {
      query.andWhere("influencer.locationCity ILIKE :locationCity", {
        locationCity: `%${locationCity}%`,
      });
    }

    if (gender) {
      query.andWhere("LOWER(influencer.gender) = LOWER(:gender)", { gender });
    }

    if (languages && languages.length > 0) {
      query.andWhere("influencer.languages && :languages", { languages });
    }

    if (priceMin !== undefined && priceMin !== null) {
      query.andWhere("influencer.minPrice >= :priceMin", { priceMin });
    }

    if (priceMax !== undefined && priceMax !== null) {
      query.andWhere("influencer.maxPrice <= :priceMax", { priceMax });
    }

    if (audienceGender) {
      query.andWhere(
        "(influencer.audienceGenderRatio->>:audienceGenderType)::float > 0.5",
        {
          audienceGenderType: audienceGender.toLowerCase(),
        },
      );
    }

    if (rankingTier) {
      query.andWhere("influencer.rankingTier = :rankingTier", { rankingTier });
    }

    if (minRating !== undefined && minRating !== null) {
      query.andWhere("CAST(influencer.avgRating AS DECIMAL) >= :minRating", {
        minRating,
      });
    }

    if (maxRating !== undefined && maxRating !== null) {
      query.andWhere("CAST(influencer.avgRating AS DECIMAL) <= :maxRating", {
        maxRating,
      });
    }

    if (verified !== undefined && verified !== null) {
      query.andWhere("influencer.verified = :verified", { verified });
    }

    // Filter by ranking tier if provided

    query.addSelect((subQuery) => {
      return subQuery
        .select("COUNT(collaboration.id)", "count")
        .from(Collaboration, "collaboration")
        .where("collaboration.influencerId = influencer.id")
        .andWhere("collaboration.status = :collabStatus", {
          collabStatus: CollaborationStatus.COMPLETED,
        });
    }, "completed_collaborations_count");

    query
      .orderBy("completed_collaborations_count", "DESC")
      .addOrderBy("influencer.createdAt", "DESC");

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Map items to include completed collaborations count
    // Using a single query to fetch all counts for the current page
    const influencerIds = items.map((i) => i.id);
    let collabCounts: { influencerId: string; count: string }[] = [];

    if (influencerIds.length > 0) {
      collabCounts = await this.collaborationRepo
        .createQueryBuilder("collaboration")
        .select("collaboration.influencerId", "influencerId")
        .addSelect("COUNT(*)", "count")
        .where("collaboration.influencerId IN (:...influencerIds)", {
          influencerIds,
        })
        .andWhere("collaboration.status = :status", {
          status: CollaborationStatus.COMPLETED,
        })
        .groupBy("collaboration.influencerId")
        .getRawMany();
    }

    const countsMap = new Map(
      collabCounts.map((c) => [c.influencerId, parseInt(c.count)]),
    );

    const syncedItems = items.map((item) => {
      const syncedItem = {
        ...item,
        completedCollaborations: countsMap.get(item.id) || 0,
      };
      return syncedItem as InfluencerProfile & {
        completedCollaborations: number;
      };
    });

    return {
      items: syncedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInfluencerById(
    id: string,
  ): Promise<InfluencerProfile & { completedCollaborations: number }> {
    try {
      const profile = await this.influencerRepo.findOne({
        where: { id },
        relations: ["user", "user.profile"],
      });

      if (!profile) {
        throw new NotFoundException("Influencer not found");
      }

      const completedCollaborations =
        await this.getCompletedCollaborationsCount(profile.id);
      return { ...profile, completedCollaborations };
    } catch (error) {
      cif(
        isEntityNotFoundError,
        new NotFoundException("Influencer not found"),
      )(error);
      throw error;
    }
  }

  async getInfluencerBySlug(
    slug: string,
  ): Promise<InfluencerProfile & { completedCollaborations: number }> {
    try {
      const profile = await this.influencerRepo.findOne({
        where: { slug },
        relations: ["user", "user.profile"],
      });

      if (!profile) {
        throw new NotFoundException("Influencer with this slug not found");
      }

      const completedCollaborations =
        await this.getCompletedCollaborationsCount(profile.id);
      return { ...profile, completedCollaborations };
    } catch (error) {
      cif(
        isEntityNotFoundError,
        new NotFoundException("Influencer with this slug not found"),
      )(error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException("User not found");

    user.status = status;
    return this.userRepo.save(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException("User not found");

    // Use a transaction for consistency
    await this.dataSource.transaction(async (manager) => {
      // Soft delete related profiles first (though order doesn't strictly matter for soft delete)
      await manager
        .getRepository(InfluencerProfile)
        .softDelete({ user: { id: userId } });
      await manager.getRepository(Profile).softDelete({ user: { id: userId } });

      // Soft delete the user
      await manager.getRepository(User).softDelete(userId);
    });
  }
}
