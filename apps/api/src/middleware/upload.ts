import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "./errorHandler";

const UPLOAD_DIR = path.resolve("uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, `File type ${file.mimetype} is not allowed`));
  }
}

const uploadInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export function uploadSingle(fieldName: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    uploadInstance.single(fieldName)(req as any, res as any, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new AppError(400, "File size exceeds 10MB limit"));
        }
        return next(new AppError(400, err.message));
      }
      if (err) return next(err);
      next();
    });
  };
}

export function uploadMultiple(fieldName: string, maxCount = 5) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    uploadInstance.array(fieldName, maxCount)(req as any, res as any, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new AppError(400, "File size exceeds 10MB limit"));
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(new AppError(400, `Too many files. Maximum is ${maxCount}`));
        }
        return next(new AppError(400, err.message));
      }
      if (err) return next(err);
      next();
    });
  };
}

export function uploadFields(fields: { name: string; maxCount: number }[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    uploadInstance.fields(fields)(req as any, res as any, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new AppError(400, "File size exceeds 10MB limit"));
        }
        return next(new AppError(400, err.message));
      }
      if (err) return next(err);
      next();
    });
  };
}

export { UPLOAD_DIR, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES };
