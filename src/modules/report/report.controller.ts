import { Controller, Post, Body, Req, Param, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  ApiOkResponseEnvelope,
  ApiCreatedResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
  ApiNotFoundResponseEnvelope,
} from "../../core/swagger/response-envelope";
import { SuccessResponseDto } from "../../core/dto/message-response.dto";
import { ReportService } from "./report.service";
import { CreateReportDto } from "./dto/create-report.dto";

import { UserRole } from "../../database/entities/enums";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { Report } from "../../database/entities/report.entity";

@ApiTags("Report")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INFLUENCER, UserRole.USER, UserRole.ADMIN)
@Controller("v1/report")
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Submit a report against a user" })
  @ApiCreatedResponseEnvelope(Report)
  @ApiUnauthorizedResponseEnvelope()
  async create(@Req() req: any, @Body() createDto: CreateReportDto) {
    return this.reportService.createReport(req.user.id, createDto);
  }

  @Post(":id/delete")
  @ApiOperation({ summary: "Delete a report" })
  @ApiOkResponseEnvelope(SuccessResponseDto)
  @ApiUnauthorizedResponseEnvelope()
  @ApiNotFoundResponseEnvelope("Report not found")
  async delete(@Req() req: any, @Param("id") id: string) {
    await this.reportService.deleteReport(req.user.id, id);
    return { success: true };
  }
}
