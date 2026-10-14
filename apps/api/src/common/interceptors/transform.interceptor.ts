import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Wraps every successful controller response in a consistent envelope:
 * `{ success: true, data, timestamp }`.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown): ApiResponse<unknown> => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
