import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  Query,
  Param,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  ApiOkResponseEnvelope,
  ApiBadRequestResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
  ApiForbiddenResponseEnvelope,
  ApiNotFoundResponseEnvelope,
  EmptyResponseDto,
} from "../../core/swagger/response-envelope";
import { InfluencerService } from "./influencer.service";
import { SaveInfluencerProfileDto } from "./dto/save-influencer-profile.dto";
import { SearchInfluencersDto } from "./dto/search-influencers.dto";
import { AllowUnauthorized } from "../auth/unauthorized/allow-unauthorixed";
import { InfluencerProfile } from "../../database/entities/influencer-profile.entity";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { UserRole, UserStatus } from "../../database/entities/enums";
import { User } from "../../database/entities/user.entity";

@ApiTags("Influencer")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("v1/influencer")
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @ApiBearerAuth()
  @Roles(UserRole.INFLUENCER, UserRole.ADMIN)
  @Get("profile")
  @ApiOperation({ summary: "Get current user influencer profile" })
  @ApiOkResponseEnvelope(InfluencerProfile)
  @ApiUnauthorizedResponseEnvelope()
  @ApiNotFoundResponseEnvelope("Influencer profile not found")
  async getProfile(@Req() req: any) {
    return this.influencerService.getInfluencerProfile(req.user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INFLUENCER)
  @Post("profile")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Create current user influencer profile" })
  @ApiOkResponseEnvelope(InfluencerProfile)
  @ApiUnauthorizedResponseEnvelope()
  @ApiForbiddenResponseEnvelope("Only influencers can have a profile")
  async createProfile(
    @Req() req: any,
    @Body() saveDto: SaveInfluencerProfileDto,
  ) {
    return this.influencerService.saveInfluencerProfile(req.user.id, saveDto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INFLUENCER)
  @Patch("profile")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Update current user influencer profile" })
  @ApiOkResponseEnvelope(InfluencerProfile)
  @ApiUnauthorizedResponseEnvelope()
  @ApiForbiddenResponseEnvelope("Only influencers can have a profile")
  async updateProfile(
    @Req() req: any,
    @Body() saveDto: SaveInfluencerProfileDto,
  ) {
    return this.influencerService.saveInfluencerProfile(req.user.id, saveDto);
  }

  @AllowUnauthorized()
  @Get("search")
  @ApiOperation({ summary: "Search influencers" })
  @ApiOkResponseEnvelope(InfluencerProfile, true)
  @ApiBadRequestResponseEnvelope("Invalid query parameters")
  async search(@Query() searchDto: SearchInfluencersDto) {
    return this.influencerService.searchInfluencers(searchDto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INFLUENCER, UserRole.USER, UserRole.ADMIN)
  @Get(":id")
  @ApiOperation({ summary: "Get a specific influencer profile by ID" })
  @ApiOkResponseEnvelope(InfluencerProfile)
  @ApiNotFoundResponseEnvelope("Influencer profile not found")
  async getInfluencer(@Param("id") id: string) {
    return this.influencerService.getInfluencerById(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INFLUENCER)
  @Patch("status")
  @ApiOperation({ summary: "Update current user status (Active/Inactive)" })
  @ApiOkResponseEnvelope(User)
  @ApiUnauthorizedResponseEnvelope()
  async updateStatus(@Req() req: any, @Body("status") status: UserStatus) {
    return this.influencerService.updateUserStatus(req.user.id, status);
  }

  @ApiBearerAuth()
  @Roles(UserRole.INFLUENCER)
  @Delete("account")
  @ApiOperation({ summary: "Soft delete current user account" })
  @ApiOkResponseEnvelope(EmptyResponseDto)
  @ApiUnauthorizedResponseEnvelope()
  async deleteAccount(@Req() req: any) {
    return this.influencerService.deleteAccount(req.user.id);
  }
}
