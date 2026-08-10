import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubscriptionPlan } from "../../database/entities/subscription-plan.entity";
import {
  UserSubscription,
  UserSubscriptionStatus,
} from "../../database/entities/user-subscription.entity";
import { User } from "../../database/entities/user.entity";
import { SaveSubscriptionPlanDto } from "./dto/save-subscription-plan.dto";
import { VerifySubscriptionDto } from "./dto/subscription.dto";
import { isUniqueConstraintError } from "../../database/errors/unique-constraint.type-guard";
import { RazorpayService } from "../payment/razorpay.service";
import { ConfigService } from "@nestjs/config";
import { SubscriptionTier } from "../../database/entities/enums";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private readonly userSubRepo: Repository<UserSubscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly razorpayService: RazorpayService,
    private readonly configService: ConfigService,
  ) {}

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return await this.planRepo.find();
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException("Subscription plan not found");
    return plan;
  }

  async createOrUpdatePlan(
    saveDto: SaveSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    let plan = await this.planRepo.findOne({ where: { name: saveDto.name } });

    const isFree = saveDto.name === SubscriptionTier.FREE;
    let razorpayPlanId = saveDto.razorpayPlanId;

    if (!isFree && !razorpayPlanId) {
      const priceChanged =
        plan && Number(plan.price) !== Number(saveDto.price);
      const periodChanged =
        plan && plan.billingPeriod !== saveDto.billingPeriod;

      if (!plan || !plan.razorpayPlanId || priceChanged || periodChanged) {
        const period =
          saveDto.billingPeriod === "yearly" ? "yearly" : "monthly";
        const rzpPlan = await this.razorpayService.createRazorpayPlan(
          saveDto.name,
          saveDto.price,
          period,
        );
        razorpayPlanId = rzpPlan.id;
      } else {
        razorpayPlanId = plan.razorpayPlanId;
      }
    }

    const payloadToSave = {
      ...saveDto,
      razorpayPlanId,
    };

    if (plan) {
      Object.assign(plan, payloadToSave);
      return await this.planRepo.save(plan);
    } else {
      try {
        plan = this.planRepo.create(payloadToSave);
        return await this.planRepo.save(plan);
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          // Concurrent creation, fetch and update
          plan = await this.planRepo.findOne({ where: { name: saveDto.name } });
          if (plan) {
            Object.assign(plan, payloadToSave);
            return await this.planRepo.save(plan);
          }
        }
        throw error;
      }
    }
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.getPlanById(id);
    await this.planRepo.remove(plan);
  }

  async initiateSubscription(userId: string, planId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const plan = await this.planRepo.findOne({
      where: { id: planId, isActive: true },
    });
    if (!plan) {
      throw new NotFoundException("Subscription plan not found or inactive");
    }

    let userSub = await this.userSubRepo.findOne({ where: { userId } });
    if (
      userSub &&
      (userSub.status === UserSubscriptionStatus.ACTIVE ||
        userSub.status === UserSubscriptionStatus.HALTED)
    ) {
      throw new BadRequestException(
        "User already has an active or halted subscription",
      );
    }

    if (plan.name === SubscriptionTier.FREE) {
      if (!userSub) {
        userSub = this.userSubRepo.create({
          userId,
          planId,
          status: UserSubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
        });
      } else {
        userSub.planId = planId;
        userSub.status = UserSubscriptionStatus.ACTIVE;
        userSub.razorpaySubscriptionId = null;
        userSub.currentPeriodStart = new Date();
        userSub.currentPeriodEnd = null;
        userSub.cancelledAt = null;
        userSub.metadata = null;
      }
      await this.userSubRepo.save(userSub);
      return {
        subscriptionId: null,
        activated: true,
      };
    }

    if (!plan.razorpayPlanId) {
      throw new BadRequestException(
        "Razorpay plan has not been configured for this plan",
      );
    }

    const rzpSub = await this.razorpayService.createSubscription(
      plan.razorpayPlanId,
      120, // 10 years max duration
      {
        email: user.email,
        name: user.username || "Kollabary User",
      },
    );

    if (!userSub) {
      userSub = this.userSubRepo.create({
        userId,
        planId,
        razorpaySubscriptionId: rzpSub.id,
        status: UserSubscriptionStatus.PENDING,
      });
    } else {
      userSub.planId = planId;
      userSub.razorpaySubscriptionId = rzpSub.id;
      userSub.status = UserSubscriptionStatus.PENDING;
      userSub.currentPeriodStart = null;
      userSub.currentPeriodEnd = null;
      userSub.cancelledAt = null;
      userSub.metadata = null;
    }

    await this.userSubRepo.save(userSub);

    return {
      subscriptionId: rzpSub.id,
      razorpayKeyId: this.configService.get<string>("RAZORPAY_KEY_ID"),
    };
  }

  async verifySubscriptionPayment(userId: string, dto: VerifySubscriptionDto) {
    const userSub = await this.userSubRepo.findOne({
      where: { userId, razorpaySubscriptionId: dto.razorpaySubscriptionId },
      relations: ["plan"],
    });

    if (!userSub) {
      throw new NotFoundException("Subscription not found for this user");
    }

    const isValid = this.razorpayService.verifySubscriptionSignature(
      dto.razorpaySubscriptionId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    if (!isValid) {
      throw new BadRequestException("Invalid payment signature");
    }

    const rzpSub = await this.razorpayService.fetchSubscription(
      dto.razorpaySubscriptionId,
    );

    userSub.status = UserSubscriptionStatus.ACTIVE;
    userSub.currentPeriodStart = new Date(rzpSub.current_start * 1000);
    userSub.currentPeriodEnd = new Date(rzpSub.current_end * 1000);
    userSub.metadata = {
      ...(userSub.metadata || {}),
      verification_payment_id: dto.razorpayPaymentId,
      verification_signature: dto.razorpaySignature,
    };

    return await this.userSubRepo.save(userSub);
  }

  async cancelSubscription(userId: string) {
    const userSub = await this.userSubRepo.findOne({
      where: { userId, status: UserSubscriptionStatus.ACTIVE },
    });

    if (!userSub) {
      throw new NotFoundException("No active subscription found for this user");
    }

    await this.razorpayService.cancelSubscription(
      userSub.razorpaySubscriptionId,
      true,
    );

    userSub.cancelledAt = new Date();
    return await this.userSubRepo.save(userSub);
  }
}
