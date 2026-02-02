import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../database/entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { isEntityNotFoundError } from '../../database/errors/entity-not-found.type-guard';
import { cif } from '../../database/errors/tryQuery';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepo: Repository<Profile>,
    ) { }

    async getProfile(userId: string): Promise<Profile> {
        try {
            // We use findOne since findOneByOrFail might have issues with nested relations in some TypeORM versions
            const profile = await this.profileRepo.findOne({
                where: { user: { id: userId } },
            });

            if (!profile) {
                throw new NotFoundException('Profile not found');
            }

            return profile;
        } catch (error) {
            // If it's already a NotFoundException (thrown above), cif will just rethrow it because predicate isEntityNotFoundError will be false
            // If it was some other DB error that is an EntityNotFoundError, it would throw the new NotFoundException
            cif(isEntityNotFoundError, new NotFoundException('Profile not found'))(error);
        }
    }

    async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<Profile> {
        let profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
        });

        if (!profile) {
            profile = this.profileRepo.create({
                user: { id: userId } as any,
                ...updateDto,
            });
        } else {
            Object.assign(profile, updateDto);
        }

        return await this.profileRepo.save(profile);
    }
}
