import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorBody {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  details?: unknown;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let error = "InternalServerError";
    let message: string | string[] = "Internal server error";
    let details: unknown;

    if (isHttp) {
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
        error = exception.name;
      } else if (typeof res === "object" && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
        error = (body.error as string) ?? exception.name;
        details = body.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const payload: ErrorBody = {
      success: false,
      statusCode: status,
      error,
      message,
      ...(details !== undefined ? { details } : {}),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}
