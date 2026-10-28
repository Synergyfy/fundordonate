import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RecommendationsService } from "../recommendations.service";
import {
  PublicRecommendationsQueryDto,
  SubmitLocationRecommendationDto,
} from "../dto/recommendation.dto";

/**
 * Public endpoints used by the business/consumer "Can't see your high street?"
 * form and by the Add City wizard's recommendations panel.
 */
@ApiTags("Public Location Recommendations")
@Controller("hub/recommendations")
export class PublicRecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  @ApiOperation({
    summary: "Submit a high street or local area recommendation",
  })
  @ApiResponse({ status: 201, description: "Recommendation submitted for review" })
  @ApiResponse({ status: 400, description: "Invalid city / local area" })
  async submit(@Body() dto: SubmitLocationRecommendationDto) {
    return this.recommendationsService.submit(dto);
  }

  @Get()
  @ApiOperation({
    summary: "List non-rejected recommendations (public projection)",
    description:
      "Used by the city wizard to show community suggestions. Never returns recommender identity or admin notes.",
  })
  @ApiResponse({ status: 200, description: "Successfully retrieved recommendations" })
  async list(@Query() query: PublicRecommendationsQueryDto) {
    return this.recommendationsService.listPublic(query);
  }
}
