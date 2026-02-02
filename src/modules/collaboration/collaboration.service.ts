import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UpdateCollaborationStatusDto } from './dto/update-collaboration-status.dto';
import { CollaborationStatus } from '../../database/entities/enums';
import { isEntityNotFoundError } from '../../database/errors/entity-not-found.type-guard';
import { cif } from '../../database/errors/tryQuery';

@Injectable()
export class CollaborationService {
    constructor(
        @InjectRepository(Collaboration)
        private readonly collaborationRepo: Repository<Collaboration>,
    ) { }

    async createCollaboration(requesterId: string, createDto: CreateCollaborationDto): Promise<Collaboration> {
        const collaboration = this.collaborationRepo.create({
            requester: { id: requesterId } as any,
            influencer: { id: createDto.influencerId } as any,
            title: createDto.title,
            description: createDto.description,
            proposedTerms: createDto.proposedTerms,
            startDate: createDto.startDate,
            endDate: createDto.endDate,
            status: CollaborationStatus.REQUESTED,
        });

        return await this.collaborationRepo.save(collaboration);
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

        // Only influencer can accept/reject
        if ([CollaborationStatus.ACCEPTED, CollaborationStatus.REJECTED].includes(statusDto.status)) {
            if (collaboration.influencer.id !== userId) {
                throw new ForbiddenException('Only the influencer can accept or reject the collaboration');
            }
            if (collaboration.status !== CollaborationStatus.REQUESTED) {
                throw new BadRequestException(`Cannot transition from ${collaboration.status} to ${statusDto.status}`);
            }
        }

        // Completion or Cancellation
        if (statusDto.status === CollaborationStatus.COMPLETED) {
            if (collaboration.status !== CollaborationStatus.ACCEPTED && collaboration.status !== CollaborationStatus.IN_PROGRESS) {
                throw new BadRequestException('Collaboration must be accepted or in progress to be completed');
            }
        }

        collaboration.status = statusDto.status;
        return await this.collaborationRepo.save(collaboration);
    }
}
