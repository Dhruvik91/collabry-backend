import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InfluencerService } from './influencer.service';
import { ProfileService } from '../profile/profile.service';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { Profile } from '../../database/entities/profile.entity';
import { User } from '../../database/entities/user.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { Auction } from '../../database/entities/auction.entity';
import { RankingService } from '../ranking/ranking.service';

describe('Sorting Verification', () => {
    let influencerService: InfluencerService;
    let profileService: ProfileService;

    // Track mock calls
    let influencerOrderByCalls: any[] = [];
    let influencerAddOrderByCalls: any[] = [];
    let profileOrderByCalls: any[] = [];
    let profileAddOrderByCalls: any[] = [];

    beforeEach(async () => {
        influencerOrderByCalls = [];
        influencerAddOrderByCalls = [];
        profileOrderByCalls = [];
        profileAddOrderByCalls = [];

        // Mock influencer profile query builder
        const mockInfluencerQueryBuilder = {
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockImplementation((val, order) => {
                influencerOrderByCalls.push({ val, order });
                return mockInfluencerQueryBuilder;
            }),
            addOrderBy: jest.fn().mockImplementation((val, order) => {
                influencerAddOrderByCalls.push({ val, order });
                return mockInfluencerQueryBuilder;
            }),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        // Mock profile query builder
        const mockProfileQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockImplementation((val, order) => {
                profileOrderByCalls.push({ val, order });
                return mockProfileQueryBuilder;
            }),
            addOrderBy: jest.fn().mockImplementation((val, order) => {
                profileAddOrderByCalls.push({ val, order });
                return mockProfileQueryBuilder;
            }),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
            getCount: jest.fn().mockResolvedValue(0),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InfluencerService,
                ProfileService,
                {
                    provide: getRepositoryToken(InfluencerProfile),
                    useValue: {
                        createQueryBuilder: jest.fn().mockReturnValue(mockInfluencerQueryBuilder),
                    },
                },
                {
                    provide: getRepositoryToken(Profile),
                    useValue: {
                        createQueryBuilder: jest.fn().mockReturnValue(mockProfileQueryBuilder),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(Collaboration),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(Auction),
                    useValue: {},
                },
                {
                    provide: RankingService,
                    useValue: {},
                },
                {
                    provide: DataSource,
                    useValue: {},
                },
            ],
        }).compile();

        influencerService = module.get<InfluencerService>(InfluencerService);
        profileService = module.get<ProfileService>(ProfileService);
    });

    it('influencerService.searchInfluencers should order by completed collaborations count subquery and then createdAt', async () => {
        await influencerService.searchInfluencers({ page: 1, limit: 10 } as any);

        expect(influencerOrderByCalls.length).toBe(1);
        expect(influencerOrderByCalls[0].val).toBe('completed_collaborations_count');
        expect(influencerOrderByCalls[0].order).toBe('DESC');

        expect(influencerAddOrderByCalls.length).toBe(1);
        expect(influencerAddOrderByCalls[0].val).toBe('influencer.createdAt');
        expect(influencerAddOrderByCalls[0].order).toBe('DESC');
    });

    it('profileService.searchProfiles should order by completed collaborations count subquery and then createdAt', async () => {
        await profileService.searchProfiles({ page: 1, limit: 10 } as any);

        expect(profileOrderByCalls.length).toBe(1);
        expect(profileOrderByCalls[0].val).toBe('completed_collaborations');
        expect(profileOrderByCalls[0].order).toBe('DESC');

        expect(profileAddOrderByCalls.length).toBe(1);
        expect(profileAddOrderByCalls[0].val).toBe('profile.createdAt');
        expect(profileAddOrderByCalls[0].order).toBe('DESC');
    });
});
