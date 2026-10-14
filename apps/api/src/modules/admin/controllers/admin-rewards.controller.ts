import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminRewardsService } from "../services/admin-rewards.service";
import {
  CreateRewardDefinitionDto,
  FulfilmentQueryDto,
  UpdateFulfilmentDto,
  UpdateRewardDefinitionDto,
} from "../dto/reward-admin.dto";

@ApiTags("Admin Rewards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin/rewards")
export class AdminRewardsController {
  constructor(private readonly rewardsService: AdminRewardsService) {}

  @Get()
  @ApiOperation({ summary: "List reward definitions with awarded counts" })
  @ApiResponse({ status: 200, description: "Successfully retrieved rewards" })
  async getRewards() {
    return this.rewardsService.getRewards();
  }

  @Get("fulfilment")
  @ApiOperation({ summary: "List reward fulfilment delivery orders" })
  @ApiResponse({ status: 200, description: "Successfully retrieved fulfilment orders" })
  async getFulfilments(@Query() query: FulfilmentQueryDto) {
    return this.rewardsService.getFulfilments(query);
  }

  @Put("fulfilment/:id")
  @ApiOperation({ summary: "Update fulfilment dispatch and delivery status" })
  @ApiResponse({ status: 200, description: "Fulfilment updated successfully" })
  async updateFulfilment(
    @Param("id") id: string,
    @Body() dto: UpdateFulfilmentDto,
  ) {
    return this.rewardsService.updateFulfilment(id, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get single reward definition detail" })
  @ApiResponse({ status: 200, description: "Successfully retrieved reward detail" })
  async getReward(@Param("id") id: string) {
    return this.rewardsService.getReward(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new reward badge or perk blueprint" })
  @ApiResponse({ status: 201, description: "Reward definition created successfully" })
  async createReward(@Body() dto: CreateRewardDefinitionDto) {
    return this.rewardsService.createReward(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an existing reward definition" })
  @ApiResponse({ status: 200, description: "Reward definition updated successfully" })
  async updateReward(
    @Param("id") id: string,
    @Body() dto: UpdateRewardDefinitionDto,
  ) {
    return this.rewardsService.updateReward(id, dto);
  }
}
