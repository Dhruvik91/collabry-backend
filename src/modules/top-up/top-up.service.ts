import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopUpPlan } from '../../database/entities/top-up-plan.entity';
import { CreateTopUpPlanDto, UpdateTopUpPlanDto } from './dto/top-up-plan.dto';

@Injectable()
export class TopUpService {
    constructor(
        @InjectRepository(TopUpPlan)
        private readonly planRepo: Repository<TopUpPlan>,
    ) { }

    async createPlan(dto: CreateTopUpPlanDto): Promise<TopUpPlan> {
        const plan = this.planRepo.create(dto);
        return await this.planRepo.save(plan);
    }

    async updatePlan(id: string, dto: UpdateTopUpPlanDto): Promise<TopUpPlan> {
        const plan = await this.getPlanById(id);
        Object.assign(plan, dto);
        return await this.planRepo.save(plan);
    }

    async deletePlan(id: string): Promise<void> {
        const plan = await this.getPlanById(id);
        await this.planRepo.softRemove(plan);
    }

    async getPlanById(id: string): Promise<TopUpPlan> {
        const plan = await this.planRepo.findOne({ where: { id } });
        if (!plan) throw new NotFoundException('Top-up plan not found');
        return plan;
    }

    async getAllPlans(admin = false): Promise<TopUpPlan[]> {
        const where = admin ? {} : { isActive: true };
        return await this.planRepo.find({
            where,
            order: { amount: 'ASC' },
        });
    }
}
