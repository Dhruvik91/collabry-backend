import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Pitch } from "../../database/entities/pitch.entity";
import { User } from "../../database/entities/user.entity";
import {
  PitchStatus,
  TransactionPurpose,
  UserRole,
  UserStatus,
} from "../../database/entities/enums";
import { WalletService } from "../kc-wallet/wallet.service";
import {
  KCSettingService,
  KCSettingKey,
} from "../kc-setting/kc-setting.service";
import { CreatePitchDto } from "./dto/create-pitch.dto";
import { UpdatePitchDto } from "./dto/update-pitch.dto";

@Injectable()
export class PitchService {
  constructor(
    @InjectRepository(Pitch)
    private readonly pitchRepo: Repository<Pitch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly walletService: WalletService,
    private readonly settingService: KCSettingService,
    private readonly dataSource: DataSource,
  ) {}

  async createPitch(influencerId: string, dto: CreatePitchDto) {
    const influencer = await this.userRepo.findOne({
      where: { id: influencerId },
    });
    if (!influencer) throw new NotFoundException("Influencer not found");
    if (influencer.role !== UserRole.INFLUENCER) {
      throw new ForbiddenException("Only influencers can create pitches");
    }

    if (influencer.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        "Your account must be active to create pitches",
      );
    }

    const target = await this.userRepo.findOne({ where: { id: dto.targetId } });
    if (!target) throw new NotFoundException("Target user not found");

    if (target.status !== UserStatus.ACTIVE) {
      throw new BadRequestException("Target user account is not active");
    }

    // Get pitch price
    const price = await this.settingService.getSetting(
      KCSettingKey.PITCH_PRICE,
    );

    return await this.dataSource.transaction(async (manager) => {
      // Debit coins
      await this.walletService.debit(
        influencerId,
        price,
        TransactionPurpose.PITCH_CREATION,
        { targetId: dto.targetId },
        manager,
      );

      // Create pitch
      const pitch = this.pitchRepo.create({
        influencer,
        target,
        message: dto.message,
        workUrl: dto.workUrl,
        status: PitchStatus.PENDING,
      });

      return await manager.save(pitch);
    });
  }

  async getInfluencerPitches(influencerId: string, page = 1, limit = 10) {
    const [items, total] = await this.pitchRepo.findAndCount({
      where: { influencer: { id: influencerId } },
      relations: ["target", "target.profile"],
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

  async getTargetPitches(targetId: string, page = 1, limit = 10) {
    const [items, total] = await this.pitchRepo.findAndCount({
      where: { target: { id: targetId } },
      relations: [
        "influencer",
        "influencer.influencerProfile",
        "influencer.profile",
      ],
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

  async getPitchById(id: string) {
    const pitch = await this.pitchRepo.findOne({
      where: { id },
      relations: [
        "influencer",
        "influencer.influencerProfile",
        "target",
        "target.profile",
      ],
    });
    if (!pitch) throw new NotFoundException("Pitch not found");
    return pitch;
  }

  async updatePitchStatus(userId: string, id: string, dto: UpdatePitchDto) {
    const pitch = await this.getPitchById(id);

    // Only target can accept/reject pitch
    if (pitch.target?.id !== userId) {
      throw new ForbiddenException(
        "Only the target brand can update the pitch status",
      );
    }

    pitch.status = dto.status;
    return await this.pitchRepo.save(pitch);
  }

  async getAllPitches(page = 1, limit = 10) {
    const [items, total] = await this.pitchRepo.findAndCount({
      relations: [
        "influencer",
        "influencer.profile",
        "target",
        "target.profile",
      ],
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
}
