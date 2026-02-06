import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { User } from '../../database/entities/user.entity';
import { MailerService } from '../mailer/mailer.service';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationStatusDto } from './dto/update-collaboration-status.dto';
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
    ) { }

    async createCollaboration(requesterId: string, createDto: CreateCollaborationDto): Promise<Collaboration> {
        const requester = await this.userRepo.findOne({ where: { id: requesterId }, relations: ['profile'] });

        // Try to find if influencerId is actually a profile ID
        let targetUserId = createDto.influencerId;
        const profile = await this.userRepo.manager.getRepository('InfluencerProfile').findOne({
            where: { id: createDto.influencerId },
            relations: ['user']
        }) as any;

        if (profile && profile.user) {
            targetUserId = profile.user.id;
        }

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
            influencer: { id: targetUserId } as any,
            title: createDto.title,
            description: createDto.description,
            proposedTerms: createDto.proposedTerms,
            startDate: createDto.startDate,
            endDate: createDto.endDate,
            status: CollaborationStatus.REQUESTED,
        });

        const savedCollaboration = await this.collaborationRepo.save(collaboration);

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

    async getMyCollaborations(userId: string): Promise<Collaboration[]> {
        return await this.collaborationRepo.find({
            where: [
                { requester: { id: userId } },
                { influencer: { id: userId } },
            ],
            relations: ['requester', 'influencer', 'requester.profile', 'influencer.profile'],
            order: { createdAt: 'DESC' },
        });
    }

    async getCollaborationById(id: string, userId: string): Promise<Collaboration> {
        try {
            const collaboration = await this.collaborationRepo.findOne({
                where: { id },
                relations: ['requester', 'influencer', 'requester.profile', 'influencer.profile'],
            });

            if (!collaboration) {
                throw new NotFoundException('Collaboration not found');
            }

            if (collaboration.requester.id !== userId && collaboration.influencer.id !== userId) {
                throw new ForbiddenException('You do not have access to this collaboration');
            }

            return collaboration;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Collaboration not found'))(error);
        }
    }

    async updateStatus(id: string, userId: string, statusDto: UpdateCollaborationStatusDto): Promise<Collaboration> {
        const collaboration = await this.getCollaborationById(id, userId);

        const isInfluencer = collaboration.influencer.id === userId;
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
        return await this.collaborationRepo.save(collaboration);
    }
}
