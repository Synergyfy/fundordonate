import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("App")
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "API metadata" })
  @ApiOkResponse({ description: "Basic service information and useful links." })
  info() {
    return {
      name: "FundorDonate API",
      version: "1.0.0",
      description: "Crowdfunding & Donation Platform API",
      docs: "/api/docs",
      health: "/health",
    };
  }
}
