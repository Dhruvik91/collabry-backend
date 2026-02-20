import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { User } from '../../database/entities/user.entity';
import { MailerService } from '../mailer/mailer.service';
import { RankingService } from '../ranking/ranking.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationStatusDto } from './dto/update-collaboration-status.dto';
import { UpdateCollaborationDto } from './dto/update-collaboration.dto';
import { FilterCollaborationsDto } from './dto/filter-collaborations.dto';
import { CollaborationStatus, UserRole } from '../../database/entities/enums';
import { isEntityNotFoundError } from '../../database/errors/entity-not-found.type-guard';
import { cif } from '../../database/errors/tryQuery';

@Injectable()
export class CollaborationService {
    constructor(
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly mailerService: MailerService,
        private readonly rankingService: RankingService,
    ) { }

    async createCollaboration(requesterId: string, createDto: CreateCollaborationDto): Promise<Collaboration> {
        const requester = await this.userRepo.findOne({ where: { id: requesterId }, relations: ['profile'] });

        // Resolve influencer ID if it's a profile ID or user ID
        let targetInfluencerProfileId = createDto.influencerId;
        const profileByProfileId = await this.userRepo.manager.getRepository('InfluencerProfile').findOne({
            where: { id: createDto.influencerId },
            relations: ['user']
        }) as any;

        if (!profileByProfileId) {
            // Try to find by user ID
            const profileByUserId = await this.userRepo.manager.getRepository('InfluencerProfile').findOne({
                where: { user: { id: createDto.influencerId } },
                relations: ['user']
            }) as any;

            if (profileByUserId) {
                targetInfluencerProfileId = profileByUserId.id;
            } else {
                throw new BadRequestException('Target must be a valid influencer profile or user');
            }
        }

        const finalProfile = profileByProfileId || (await this.userRepo.manager.getRepository('InfluencerProfile').findOne({
            where: { id: targetInfluencerProfileId },
            relations: ['user']
        }) as any);

        const targetUserId = finalProfile.user.id;

        const influencerUser = await this.userRepo.findOne({ where: { id: targetUserId } });

        if (!influencerUser || influencerUser.role !== UserRole.INFLUENCER) {
            throw new BadRequestException('Target user must be an influencer');
        }

        if (requesterId === targetUserId) {
            throw new BadRequestException('You cannot request a collaboration with yourself');
        }

        if (createDto.startDate && createDto.endDate && new Date(createDto.startDate) > new Date(createDto.endDate)) {
            throw new BadRequestException('Start date cannot be after end date');
        }

        const collaboration = this.collaborationRepo.create({
            requester: { id: requesterId } as any,
            influencer: { id: targetInfluencerProfileId } as any,
            title: createDto.title,
            description: createDto.description,
            proposedTerms: createDto.proposedTerms,
            startDate: createDto.startDate,
            endDate: createDto.endDate,
            status: CollaborationStatus.REQUESTED,
        });

        const savedCollaboration = await this.collaborationRepo.save(collaboration);

        // Update Ranking
        await this.rankingService.updateRanking(targetUserId);

        // Notify Influencer via Email
        if (influencerUser && requester) {
            await this.mailerService.sendCollaborationRequestEmail(
                influencerUser.email,
                requester.profile?.fullName || 'A brand/user',
                createDto.title,
            );
        }

        return savedCollaboration;
    }

    async getMyCollaborations(userId: string, filters?: FilterCollaborationsDto): Promise<Collaboration[]> {
        const qb = this.collaborationRepo
            .createQueryBuilder('collaboration')
            .leftJoinAndSelect('collaboration.requester', 'requester')
            .leftJoinAndSelect('requester.profile', 'requesterProfile')
            .leftJoinAndSelect('collaboration.influencer', 'influencer')
            .leftJoinAndSelect('influencer.user', 'influencerUser')
            .leftJoinAndSelect('influencerUser.profile', 'influencerUserProfile')
            .where(
                '(requester.id = :userId OR influencerUser.id = :userId)',
                { userId },
            );

        if (filters?.status) {
            qb.andWhere('collaboration.status = :status', { status: filters.status });
        }

        if (filters?.search) {
            qb.andWhere('collaboration.title ILIKE :search', { search: `%${filters.search}%` });
        }

        qb.orderBy('collaboration.createdAt', 'DESC');

        return qb.getMany();
    }

    async getCollaborationById(id: string, userId: string): Promise<Collaboration> {
        try {
            const collaboration = await this.collaborationRepo.findOne({
                where: { id },
                relations: ['requester', 'influencer', 'requester.profile', 'influencer.user', 'influencer.user.profile'],
            });

            if (!collaboration) {
                throw new NotFoundException('Collaboration not found');
            }

            if (collaboration.requester.id !== userId && collaboration.influencer.user.id !== userId) {
                throw new ForbiddenException('You do not have access to this collaboration');
            }

            return collaboration;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Collaboration not found'))(error);
        }
    }

    async updateStatus(id: string, userId: string, statusDto: UpdateCollaborationStatusDto): Promise<Collaboration> {
        const collaboration = await this.getCollaborationById(id, userId);

        const isInfluencer = collaboration.influencer.user.id === userId;
        const isRequester = collaboration.requester.id === userId;

        // Validation based on current status and new status
        switch (statusDto.status) {
            case CollaborationStatus.ACCEPTED:
            case CollaborationStatus.REJECTED:
                if (!isInfluencer) throw new ForbiddenException('Only the influencer can accept or reject');
                if (collaboration.status !== CollaborationStatus.REQUESTED) {
                    throw new BadRequestException(`Cannot ${statusDto.status.toLowerCase()} from current state: ${collaboration.status}`);
                }
                break;

            case CollaborationStatus.IN_PROGRESS:
                if (collaboration.status !== CollaborationStatus.ACCEPTED) {
                    throw new BadRequestException('Collaboration must be accepted before starting');
                }
                break;

            case CollaborationStatus.COMPLETED:
                if (!isInfluencer) throw new ForbiddenException('Only the influencer can mark the collaboration as completed');
                if (collaboration.status !== CollaborationStatus.IN_PROGRESS && collaboration.status !== CollaborationStatus.ACCEPTED) {
                    throw new BadRequestException('Collaboration must be in progress or accepted to be completed');
                }
                break;

            case CollaborationStatus.CANCELLED:
                if (collaboration.status === CollaborationStatus.COMPLETED) {
                    throw new BadRequestException('Cannot cancel a completed collaboration');
                }
                break;
        }

        collaboration.status = statusDto.status;
        const updatedCollaboration = await this.collaborationRepo.save(collaboration);

        // Update Ranking for the influencer
        await this.rankingService.updateRanking(collaboration.influencer.user.id);

        return updatedCollaboration;
    }

    async updateCollaboration(id: string, userId: string, updateDto: UpdateCollaborationDto): Promise<Collaboration> {
        const collaboration = await this.getCollaborationById(id, userId);

        // Only the requester can update the collaboration details (title, description, etc.)
        if (collaboration.requester.id !== userId) {
            throw new ForbiddenException('Only the requester can update collaboration details');
        }

        if (collaboration.status === CollaborationStatus.CANCELLED) {
            throw new BadRequestException(`Cannot update a cancelled collaboration`);
        }

        const isCompleted = collaboration.status === CollaborationStatus.COMPLETED;

        if (isCompleted) {
            // For completed collaborations, ONLY proof fields are allowed to be updated
            const updateKeys = Object.keys(updateDto);
            const allowedProofFields = ['proofUrls', 'proofSubmittedAt'];
            const containsForbiddenFields = updateKeys.some(key => !allowedProofFields.includes(key));

            if (containsForbiddenFields) {
                throw new BadRequestException('Only proof of completion can be updated after a collaboration is completed');
            }

            if (updateDto.proofUrls) collaboration.proofUrls = updateDto.proofUrls;
            if (updateDto.proofSubmittedAt) collaboration.proofSubmittedAt = new Date(updateDto.proofSubmittedAt);
        } else {
            // For active collaborations, allow general updates
            Object.assign(collaboration, updateDto);
        }

        const updated = await this.collaborationRepo.save(collaboration);

        // If proof was submitted, we might want to trigger a ranking update or notification
        if (updateDto.proofUrls) {
            await this.rankingService.updateRanking(collaboration.influencer.user.id);
        }

        return updated;
    }

    async deleteCollaboration(id: string, userId: string): Promise<void> {
        const collaboration = await this.getCollaborationById(id, userId);
        const influencerUserId = collaboration.influencer.user.id;

        // Allow both influencer and requester to delete if it's already cancelled or rejected?
        // Usually, only the owner (requester) can delete the request.
        if (collaboration.requester.id !== userId && collaboration.influencer.user.id !== userId) {
            throw new ForbiddenException('You do not have permission to delete this collaboration');
        }

        // Allow deletion regardless of status as requested
        // Note: For historical integrity, we might want to soft-delete in a real production app
        await this.collaborationRepo.remove(collaboration);

        // Update Ranking (though for REQUESTED it might not change much)
        await this.rankingService.updateRanking(influencerUserId);
    }
}
