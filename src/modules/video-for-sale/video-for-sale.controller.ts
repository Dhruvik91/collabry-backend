import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { VideoForSaleService } from "./video-for-sale.service";
import { CreateVideoForSaleDto } from "./dto/create-video-for-sale.dto";
import { UpdateVideoForSaleDto } from "./dto/update-video-for-sale.dto";
import { SearchVideosForSaleDto } from "./dto/search-videos-for-sale.dto";
import { JwtAuthGuard } from "../auth/Guards/jwt-guard";
import { RolesGuard } from "../auth/Guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../../database/entities/enums";
import { PaginationQueryDto } from "../../core/dto/pagination-query.dto";
import { VideoForSale } from "../../database/entities/video-for-sale.entity";
import { AllowUnauthorized } from "../auth/unauthorized/allow-unauthorixed";
import {
  ApiOkResponseEnvelope,
  ApiCreatedResponseEnvelope,
  ApiUnauthorizedResponseEnvelope,
  ApiForbiddenResponseEnvelope,
  ApiNotFoundResponseEnvelope,
  EmptyResponseDto,
} from "../../core/swagger/response-envelope";

@ApiTags("Videos For Sale")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("v1/videos-for-sale")
export class VideoForSaleController {
  constructor(private readonly videoForSaleService: VideoForSaleService) {}

  @Post()
  @Roles(UserRole.INFLUENCER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Post a new video for sale (Influencer only)" })
  @ApiCreatedResponseEnvelope(VideoForSale)
  @ApiUnauthorizedResponseEnvelope()
  @ApiForbiddenResponseEnvelope("Only influencers can post videos for sale")
  create(@Req() req: any, @Body() createDto: CreateVideoForSaleDto) {
    return this.videoForSaleService.create(req.user.id, createDto);
  }

  @Get()
  @AllowUnauthorized()
  @ApiOperation({ summary: "List and search all videos for sale" })
  @ApiOkResponseEnvelope(VideoForSale, true)
  findAll(@Query() searchDto: SearchVideosForSaleDto) {
    return this.videoForSaleService.findAll(searchDto);
  }

  @Get("my")
  @Roles(UserRole.INFLUENCER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List current influencer’s videos for sale" })
  @ApiOkResponseEnvelope(VideoForSale, true)
  findMyVideos(@Req() req: any, @Query() query: PaginationQueryDto) {
    return this.videoForSaleService.findMyVideos(
      req.user.id,
      query.page,
      query.limit,
    );
  }

  @Get(":id")
  @AllowUnauthorized()
  @ApiOperation({ summary: "Get details of a video for sale" })
  @ApiOkResponseEnvelope(VideoForSale)
  @ApiNotFoundResponseEnvelope("Video not found")
  findOne(@Param("id") id: string) {
    return this.videoForSaleService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.INFLUENCER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a video for sale" })
  @ApiOkResponseEnvelope(VideoForSale)
  @ApiUnauthorizedResponseEnvelope()
  @ApiForbiddenResponseEnvelope(
    "Only the owning influencer can update the video",
  )
  @ApiNotFoundResponseEnvelope("Video not found")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() updateDto: UpdateVideoForSaleDto,
  ) {
    return this.videoForSaleService.update(req.user.id, id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.INFLUENCER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a video for sale (Owner or Admin only)" })
  @ApiOkResponseEnvelope(EmptyResponseDto)
  @ApiUnauthorizedResponseEnvelope()
  @ApiForbiddenResponseEnvelope("Permission denied")
  @ApiNotFoundResponseEnvelope("Video not found")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.videoForSaleService.remove(req.user.id, req.user.role, id);
  }
}
