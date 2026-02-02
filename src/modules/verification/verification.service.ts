import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VerificationRequest } from '../../database/entities/verification-request.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { VerificationStatus } from '../../database/entities/enums';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class VerificationService {
    constructor(
        @InjectRepository(VerificationRequest)
        private readonly requestRepo: Repository<VerificationRequest>,
        @InjectRepository(InfluencerProfile)
        private readonly influencerRepo: Repository<InfluencerProfile>,
        private readonly dataSource: DataSource,
        private readonly mailerService: MailerService,
    ) { }

    async createRequest(userId: string, createDto: CreateVerificationRequestDto): Promise<VerificationRequest> {
        const influencer = await this.influencerRepo.findOne({
            where: { user: { id: userId } },
        });

        if (!influencer) {
            throw new BadRequestException('Only influencers can submit verification requests');
        }

        // Check for pending request
        const pendingRequest = await this.requestRepo.findOne({
            where: { influencerProfile: { id: influencer.id }, status: VerificationStatus.PENDING },
        });

        if (pendingRequest) {
            throw new BadRequestException('You already have a pending verification request');
        }

        const request = this.requestRepo.create({
            influencerProfile: { id: influencer.id } as any,
            documents: createDto.documents,
            status: VerificationStatus.PENDING,
        });

        return await this.requestRepo.save(request);
    }

    async getMyRequests(userId: string): Promise<VerificationRequest[]> {
        const influencer = await this.influencerRepo.findOne({ where: { user: { id: userId } } });
        if (!influencer) return [];

        return await this.requestRepo.find({
            where: { influencerProfile: { id: influencer.id } },
            order: { createdAt: 'DESC' },
        });
    }

    async getAllRequests(): Promise<VerificationRequest[]> {
        return await this.requestRepo.find({
            relations: ['influencerProfile', 'influencerProfile.user', 'influencerProfile.user.profile'],
            order: { createdAt: 'DESC' },
        });
    }

    async updateStatus(id: string, status: VerificationStatus): Promise<VerificationRequest> {
        return await this.dataSource.transaction(async (manager) => {
            const request = await manager.findOne(VerificationRequest, {
                where: { id },
                relations: ['influencerProfile', 'influencerProfile.user'],
            });

            if (!request) throw new NotFoundException('Verification request not found');

            request.status = status;
            const savedRequest = await manager.save(VerificationRequest, request);

            if (status === VerificationStatus.APPROVED) {
                request.influencerProfile.verified = true;
                await manager.save(InfluencerProfile, request.influencerProfile);
            } else if (status === VerificationStatus.REJECTED) {
                request.influencerProfile.verified = false;
                await manager.save(InfluencerProfile, request.influencerProfile);
            }

            // Notify Influencer via Email
            if (request.influencerProfile?.user?.email) {
                await this.mailerService.sendVerificationUpdateEmail(
                    request.influencerProfile.user.email,
                    status,
                );
            }

            return savedRequest;
        });
    }
}
