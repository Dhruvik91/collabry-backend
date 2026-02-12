import { Controller, Post, Body, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('Report')
@ApiBearerAuth()
@Controller('v1/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Post()
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
