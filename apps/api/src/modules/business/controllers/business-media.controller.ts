import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { uploadsTempDir } from "@/common/uploads";
import { BusinessOwnerGuard } from "../guards/business-owner.guard";
import { CurrentBusiness } from "../decorators/current-business.decorator";
import {
  BusinessMediaService,
  MAX_UPLOAD_BYTES,
} from "../services/business-media.service";
import { MediaLinkDto } from "../dto/media-link.dto";

@ApiTags("Business Campaign Media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
@Controller("business/campaigns/:campaignId/media")
export class BusinessMediaController {
  constructor(private readonly mediaService: BusinessMediaService) {}

  @Post()
  @ApiOperation({
    summary: "Upload campaign media",
    description:
      "Uploads an image or video for a draft campaign. The file is accepted only when its declared MIME type, extension and real magic-byte signature agree, and it is inside the per-type size limit.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
      required: ["file"],
    },
  })
  @ApiResponse({ status: 201, description: "Media stored" })
  @UseInterceptors(
    FileInterceptor("file", {
      // Stream the body to a staging file instead of buffering it in memory.
      dest: uploadsTempDir(),
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  async upload(
    @CurrentBusiness("id") businessId: string,
    @Param("campaignId") campaignId: string,
    @UploadedFile() file: any,
  ) {
    return this.mediaService.uploadFile(businessId, campaignId, file);
  }

  @Post("link")
  @ApiOperation({
    summary: "Verify a media link",
    description:
      "Validates a remote image/video URL: http(s) only, no embedded credentials, DNS must resolve to a public address (no localhost/private ranges) and the response content type must be an accepted image or video.",
  })
  @ApiResponse({ status: 201, description: "Link verified" })
  async verifyLink(
    @CurrentBusiness("id") businessId: string,
    @Param("campaignId") campaignId: string,
    @Body() dto: MediaLinkDto,
  ) {
    return this.mediaService.verifyRemoteLink(businessId, campaignId, dto.url);
  }
}
