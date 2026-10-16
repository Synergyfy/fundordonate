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

function serializeData(val: unknown): unknown {
  if (val === null || val === undefined) {
    return val;
  }
  if (typeof val === "bigint") {
    return Number(val);
  }
  if (val instanceof Date) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(serializeData);
  }
  if (typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(val)) {
      out[key] = serializeData(prop);
    }
    return out;
  }
  return val;
}

/**
 * Wraps every successful controller response in a consistent envelope:
 * `{ success: true, data, timestamp }`. Safely converts BigInt values to Numbers.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown): ApiResponse<unknown> => ({
        success: true,
        data: serializeData(data),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
