import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RankingService } from './ranking.service';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { Collaboration } from '../../database/entities/collaboration.entity';
import { Review } from '../../database/entities/review.entity';
import { CollaborationStatus } from '../../database/entities/enums';

describe('RankingService', () => {
    let service: RankingService;
    let influencerRepo: any;
    let collaborationRepo: any;
    let reviewRepo: any;

    beforeEach(async () => {
        influencerRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
            manager: {
                getRepository: jest.fn().mockReturnValue({
                    count: jest.fn().mockResolvedValue(0),
                }),
            },
        };
        collaborationRepo = {
            count: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
                getMany: jest.fn().mockResolvedValue([]),
            }),
        };
        reviewRepo = {
            find: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RankingService,
                {
                    provide: getRepositoryToken(InfluencerProfile),
                    useValue: influencerRepo,
                },
                {
                    provide: getRepositoryToken(Collaboration),
                    useValue: collaborationRepo,
                },
                {
                    provide: getRepositoryToken(Review),
                    useValue: reviewRepo,
                },
            ],
        }).compile();

        service = module.get<RankingService>(RankingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should calculate "Rising Creator" for new influencers', async () => {
        influencerRepo.findOne.mockResolvedValue({ id: 'prof-1', user: { id: 'user-1' }, verified: false });
        collaborationRepo.count.mockResolvedValue(1); // One completed collab

        const result = await service.calculateRanking('user-1');
        expect(result.rankingTier).toBe('Rising Creator');
        expect(result.totalScore).toBeGreaterThanOrEqual(0);
        expect(result.requirementsMet.completedCollabs).toBe(true);
    });

    it('should calculate "Elite Creator" for high-performing influencers', async () => {
        influencerRepo.findOne.mockResolvedValue({ id: 'prof-1', user: { id: 'user-1' }, verified: true });
        collaborationRepo.count.mockResolvedValue(35); // Completed
        collaborationRepo.createQueryBuilder().getCount.mockResolvedValue(25); // Paid
        reviewRepo.find.mockResolvedValue([{ rating: 5 }, { rating: 4 }, { rating: 5 }]); // Avg 4.66

        // For completion rate
        collaborationRepo.count.mockImplementation((opt) => {
            if (opt.where.status) return Promise.resolve(35); // Completed
            return Promise.resolve(38); // Accepted/Cancelled (92% completion)
        });

        const result = await service.calculateRanking('user-1');
        expect(result.rankingTier).toBe('Elite Creator');
        expect(result.totalScore).toBeGreaterThanOrEqual(75);
    });
});
