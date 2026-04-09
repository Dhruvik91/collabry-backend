import { Controller, Post, Body, Req, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';

import { UserRole } from '../../database/entities/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/Guards/jwt-guard';
import { RolesGuard } from '../auth/Guards/roles.guard';

@ApiTags('Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INFLUENCER, UserRole.USER, UserRole.ADMIN)
@Controller('v1/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a report against a user' })
  @ApiCreatedResponse({ description: 'Report submitted successfully' })
  async create(@Req() req: any, @Body() createDto: CreateReportDto) {
    return this.reportService.createReport(req.user.id, createDto);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiCreatedResponse({ description: 'Report deleted successfully' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.reportService.deleteReport(req.user.id, id);
  }
}
