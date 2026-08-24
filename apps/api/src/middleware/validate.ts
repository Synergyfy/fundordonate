import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "./errorHandler";

type RequestSource = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: RequestSource = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.join(".");
          return path ? `${path}: ${e.message}` : e.message;
        });
        return next(new AppError(400, messages.join("; ")));
      }
      next(error);
    }
  };
}

export function validateBody(schema: ZodSchema) {
  return validate(schema, "body");
}

export function validateQuery(schema: ZodSchema) {
  return validate(schema, "query");
}

export function validateParams(schema: ZodSchema) {
  return validate(schema, "params");
}
