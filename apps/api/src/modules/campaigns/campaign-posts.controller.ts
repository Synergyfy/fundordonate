import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@/auth/types/jwt-payload";
import { CampaignPostsService } from "./campaign-posts.service";
import {
  CreateCampaignPostDto,
  UpdateCampaignPostDto,
} from "./dto/campaign-post.dto";

@ApiTags("Campaign Posts")
@Controller("campaigns/:campaignId/posts")
export class CampaignPostsController {
  constructor(private readonly postsService: CampaignPostsService) {}

  @Get()
  @ApiOperation({ summary: "List public campaign updates" })
  async list(
    @Param("campaignId") campaignId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.postsService.list(
      campaignId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Post a campaign update (campaign owner/admin)" })
  async create(
    @Param("campaignId") campaignId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCampaignPostDto,
  ) {
    return this.postsService.create(campaignId, user.id, user.role, dto);
  }

  @Put(":postId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit a campaign update (campaign owner/admin)" })
  async update(
    @Param("campaignId") campaignId: string,
    @Param("postId") postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCampaignPostDto,
  ) {
    return this.postsService.update(
      campaignId,
      postId,
      user.id,
      user.role,
      dto,
    );
  }

  @Delete(":postId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a campaign update (campaign owner/admin)" })
  async remove(
    @Param("campaignId") campaignId: string,
    @Param("postId") postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.remove(campaignId, postId, user.id, user.role);
  }
}
