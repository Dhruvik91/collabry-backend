import { Controller, Post, Get, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  ApiOkResponseEnvelope,
  ApiCreatedResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
  ApiConflictResponseEnvelope,
} from "../../core/swagger/response-envelope";
import { VerificationService } from "./verification.service";
import { CreateVerificationRequestDto } from "./dto/create-verification-request.dto";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../database/entities/enums";
import { VerificationRequest } from "../../database/entities/verification-request.entity";

@ApiTags("Verification")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INFLUENCER, UserRole.ADMIN, UserRole.USER)
@Controller("v1/verification")
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post("request")
  @ApiOperation({ summary: "Submit a verification request" })
  @ApiCreatedResponseEnvelope(VerificationRequest)
  @ApiUnauthorizedResponseEnvelope()
  @ApiConflictResponseEnvelope("Pending verification request already exists")
  async create(
    @Req() req: any,
    @Body() createDto: CreateVerificationRequestDto,
  ) {
    return this.verificationService.createRequest(req.user.id, createDto);
  }

  @Get("my-requests")
  @ApiOperation({ summary: "Get my verification requests" })
  @ApiOkResponseEnvelope(VerificationRequest, true)
  @ApiUnauthorizedResponseEnvelope()
  async getMyRequests(@Req() req: any) {
    return this.verificationService.getMyRequests(req.user.id);
  }
}
