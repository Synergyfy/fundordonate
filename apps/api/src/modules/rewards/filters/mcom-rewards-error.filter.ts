import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { McomRewardsError } from "@/mcom/rewards-client.service";

/**
 * Maps a {@link McomRewardsError} from the provider into a clear, contract-
 * aware HTTP response so callers (admin console / API consumers) see *what
 * went wrong* instead of a generic 500:
 *
 * ```json
 * {
 *   "success": false,
 *   "message": "Forbidden: business \"x\" has no active subscription…",
 *   "messages": ["…"],              // preserved array for validation errors
 *   "code": "BUSINESS_NOT_ENTITLED",
 *   "source": "mcom-rewards",
 *   "statusCode": 403,
 *   "retryable": false
 * }
 * ```
 *
 * Non-MCOM exceptions are re-thrown untouched (Nest's default handling).
 */
@Catch(McomRewardsError)
export class McomRewardsErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(McomRewardsErrorFilter.name);

  catch(error: McomRewardsError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Guard against a synthetic/unknown status.
    const status =
      error.httpStatus >= 400 && error.httpStatus <= 599
        ? error.httpStatus
        : HttpStatus.BAD_GATEWAY;

    this.logger.warn(
      `Propagating MCOM Rewards error to client: ${status}` +
        `${error.code ? ` [${error.code}]` : ""}: ${error.message.replace(/\n/g, " | ")}`,
    );

    response.status(status).json({
      success: false,
      message: error.message,
      messages: error.messages,
      code: error.code,
      source: "mcom-rewards",
      statusCode: status,
      retryable: error.retryable,
      timestamp: new Date().toISOString(),
    });
  }
}
