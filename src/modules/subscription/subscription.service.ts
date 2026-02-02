import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';
import { SaveSubscriptionPlanDto } from './dto/save-subscription-plan.dto';
import { isUniqueConstraintError } from '../../database/errors/unique-constraint.type-guard';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectRepository(SubscriptionPlan)
        private readonly planRepo: Repository<SubscriptionPlan>,
    ) { }

    async getAllPlans(): Promise<SubscriptionPlan[]> {
        return await this.planRepo.find();
    }

    async getPlanById(id: string): Promise<SubscriptionPlan> {
        const plan = await this.planRepo.findOne({ where: { id } });
        if (!plan) throw new NotFoundException('Subscription plan not found');
        return plan;
    }

    async createOrUpdatePlan(saveDto: SaveSubscriptionPlanDto): Promise<SubscriptionPlan> {
        let plan = await this.planRepo.findOne({ where: { name: saveDto.name } });
        if (plan) {
            Object.assign(plan, saveDto);
            return await this.planRepo.save(plan);
        } else {
            try {
                plan = this.planRepo.create(saveDto);
                return await this.planRepo.save(plan);
            } catch (error) {
                if (isUniqueConstraintError(error)) {
                    // Concurrent creation, fetch and update
                    plan = await this.planRepo.findOne({ where: { name: saveDto.name } });
                    if (plan) {
                        Object.assign(plan, saveDto);
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
}
