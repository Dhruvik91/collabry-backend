import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../../database/entities/report.entity';
import { InfluencerProfile } from '../../database/entities/influencer-profile.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from '../../database/entities/enums';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
  ) { }

  async createReport(reporterId: string, createDto: CreateReportDto): Promise<Report> {
    let resolvedTargetUserId = createDto.targetUserId || createDto.targetId;

    // If it's an influencer report, try to resolve the profile ID
    if (createDto.targetType === 'influencer' || !createDto.targetUserId) {
      const profile = await this.influencerProfileRepo.findOne({
        where: { id: createDto.targetId },
        relations: ['user']
      });
      if (profile && profile.user) {
        resolvedTargetUserId = profile.user.id;
      }
    }

    const report = this.reportRepo.create({
      reporter: { id: reporterId } as any,
      targetUser: { id: resolvedTargetUserId } as any,
      targetType: createDto.targetType,
      reason: createDto.reason,
      description: createDto.description || createDto.details,
      status: ReportStatus.OPEN,
    });

    return await this.reportRepo.save(report);
  }

  async getAllReports(): Promise<Report[]> {
    return await this.reportRepo.find({
      relations: ['reporter', 'targetUser', 'reporter.profile', 'targetUser.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReportById(id: string): Promise<Report> {
    return await this.reportRepo.findOne({
      where: { id },
      relations: ['reporter', 'targetUser', 'reporter.profile', 'targetUser.profile'],
    });
  }

  async updateReportStatus(id: string, status: ReportStatus): Promise<Report> {
    const report = await this.getReportById(id);
    if (!report) return null;

    report.status = status;
    if (status === ReportStatus.RESOLVED) {
      report.resolvedAt = new Date();
    }

    return await this.reportRepo.save(report);
  }

  async deleteReport(userId: string, id: string): Promise<void> {
    const report = await this.reportRepo.findOne({ where: { id }, relations: ['reporter'] });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.reporter.id !== userId) {
      throw new ForbiddenException('You can only delete your own reports');
    }

    await this.reportRepo.remove(report);
  }
}
