import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { VerificationRequest } from "../../database/entities/verification-request.entity";
import { InfluencerProfile } from "../../database/entities/influencer-profile.entity";
import { User } from "../../database/entities/user.entity";
import { Profile } from "../../database/entities/profile.entity";
import { CreateVerificationRequestDto } from "./dto/create-verification-request.dto";
import { VerificationStatus } from "../../database/entities/enums";
import { AppMailerService } from "../mailer/mailer.service";
import { RankingService } from "../ranking/ranking.service";

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRequest)
    private readonly requestRepo: Repository<VerificationRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly mailerService: AppMailerService,
    private readonly rankingService: RankingService,
  ) {}

  async createRequest(
    userId: string,
    createDto: CreateVerificationRequestDto,
  ): Promise<VerificationRequest> {
    // Check for pending request
    const pendingRequest = await this.requestRepo.findOne({
      where: { user: { id: userId }, status: VerificationStatus.PENDING },
    });

    if (pendingRequest) {
      throw new BadRequestException(
        "You already have a pending verification request",
      );
    }

    const request = this.requestRepo.create({
      user: { id: userId } as any,
      documents: createDto.documents,
      status: VerificationStatus.PENDING,
    });

    return await this.requestRepo.save(request);
  }

  async getMyRequests(userId: string): Promise<VerificationRequest[]> {
    return await this.requestRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });
  }

  async getAllRequests(): Promise<VerificationRequest[]> {
    return await this.requestRepo.find({
      relations: ["user", "user.profile", "user.influencerProfile"],
      order: { createdAt: "DESC" },
    });
  }

  async updateStatus(
    id: string,
    status: VerificationStatus,
    adminNotes?: string,
  ): Promise<VerificationRequest> {
    const savedRequest = await this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(VerificationRequest, {
        where: { id },
        relations: ["user", "user.profile", "user.influencerProfile"],
      });

      if (!request)
        throw new NotFoundException("Verification request not found");

      request.status = status;
      if (adminNotes) {
        request.adminNotes = adminNotes;
      }

      const saved = await manager.save(VerificationRequest, request);

      const isVerified = status === VerificationStatus.APPROVED;

      // Update main Profile
      if (request.user.profile) {
        request.user.profile.verified = isVerified;
        await manager.save(Profile, request.user.profile);
      }

      // Update InfluencerProfile if exists
      if (request.user.influencerProfile) {
        request.user.influencerProfile.verified = isVerified;
        await manager.save(InfluencerProfile, request.user.influencerProfile);
      }

      return saved;
    });

    // Update Ranking outside the transaction to avoid lock contention/deadlock
    try {
      const requestWithUser = await this.requestRepo.findOne({
        where: { id: savedRequest.id },
        relations: ["user"],
      });

      if (requestWithUser?.user?.id) {
        await this.rankingService.updateRanking(requestWithUser.user.id);
      }

      // Notify User via Email
      if (requestWithUser?.user?.email) {
        await this.mailerService.sendVerificationUpdateEmail(
          requestWithUser.user.email,
          status,
        );
      }
    } catch (error) {
      console.error("Error during post-verification updates:", error);
      // Don't fail the whole request if email/ranking fails
    }

    return savedRequest;
  }
}
