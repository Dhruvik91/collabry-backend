import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../database/entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SaveProfileDto } from './dto/save-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
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
            const profile = await this.profileRepo.findOne({
                where: { user: { id: userId } },
            });

            if (!profile) {
                throw new NotFoundException('Profile not found');
            }

            return profile;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Profile not found'))(error);
        }
    }

    async saveProfile(userId: string, saveDto: SaveProfileDto): Promise<Profile> {
        let profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
        });

        if (!profile) {
            profile = this.profileRepo.create({
                user: { id: userId } as any,
                ...saveDto,
            });
        } else {
            Object.assign(profile, saveDto);
        }

        return await this.profileRepo.save(profile);
    }

    async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<Profile> {
        return this.saveProfile(userId, updateDto as SaveProfileDto);
    }

    async searchProfiles(searchDto: SearchProfilesDto) {
        const { name, username, location, page, limit } = searchDto;
        const query = this.profileRepo.createQueryBuilder('profile')
            .leftJoinAndSelect('profile.user', 'user');

        if (name) {
            query.andWhere('profile.fullName ILIKE :name', { name: `%${name}%` });
        }

        if (username) {
            query.andWhere('profile.username ILIKE :username', { username: `%${username}%` });
        }

        if (location) {
            query.andWhere('profile.location ILIKE :location', { location: `%${location}%` });
        }

        const [items, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

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

    async getProfileById(id: string): Promise<Profile> {
        try {
            const profile = await this.profileRepo.findOne({
                where: { id },
                relations: ['user'],
            });

            if (!profile) {
                throw new NotFoundException('Profile not found');
            }

            return profile;
        } catch (error) {
            cif(isEntityNotFoundError, new NotFoundException('Profile not found'))(error);
        }
    }
}
