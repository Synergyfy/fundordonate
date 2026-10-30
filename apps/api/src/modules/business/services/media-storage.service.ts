import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import axios from "axios";
import FormData from "form-data";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { uploadsRoot, uploadsTempDir } from "@/common/uploads";

export type MediaStorageProvider = "local" | "cloudinary";

export interface StoredMedia {
  url: string;
  provider: MediaStorageProvider;
  publicId?: string;
  bytes: number;
}

/** `MEDIA_STORAGE=cloudinary` sends validated media to the CDN; default is local disk (dev). */
export function mediaStorageProvider(): MediaStorageProvider {
  return (process.env.MEDIA_STORAGE ?? "local").trim().toLowerCase() ===
    "cloudinary"
    ? "cloudinary"
    : "local";
}

const sha1 = (value: string) => createHash("sha1").update(value).digest("hex");

/** Cloudinary signs alphabetically-sorted params with the API secret appended. */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return sha1(`${payload}${apiSecret}`);
}

/**
 * Storage abstraction for validated campaign media.
 *
 * The upload pipeline (MIME allowlist and magic-byte sniffing) always runs
 * first; this service only decides where the validated bytes live. Everything
 * is file/stream based so a large upload never has to sit in the Node heap.
 */
@Injectable()
export class MediaStorageService implements OnModuleInit {
  private readonly logger = new Logger(MediaStorageService.name);

  /** Sweep abandoned staging files (crash between multer and the pipeline). */
  async onModuleInit(): Promise<void> {
    await this.pruneTempUploads().catch(() => undefined);
  }

  async store(input: {
    sourcePath: string;
    mimeType: string;
    fileName: string;
    campaignId: string;
  }): Promise<StoredMedia> {
    return mediaStorageProvider() === "cloudinary"
      ? this.storeCloudinary(input)
      : this.storeLocal(input);
  }

  private async storeLocal({
    sourcePath,
    fileName,
    campaignId,
  }: {
    sourcePath: string;
    fileName: string;
    campaignId: string;
  }): Promise<StoredMedia> {
    const directory = join(uploadsRoot(), "campaigns", campaignId);
    await mkdir(directory, { recursive: true });

    const destination = join(directory, fileName);
    await copyFile(sourcePath, destination);
    const { size } = await stat(destination);

    return {
      url: `/uploads/campaigns/${campaignId}/${fileName}`,
      provider: "local",
      bytes: size,
    };
  }

  private async storeCloudinary({
    sourcePath,
    mimeType,
    fileName,
    campaignId,
  }: {
    sourcePath: string;
    mimeType: string;
    fileName: string;
    campaignId: string;
  }): Promise<StoredMedia> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error(
        "MEDIA_STORAGE=cloudinary but CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET are not set.",
      );
      throw new ServiceUnavailableException("Media storage is not configured.");
    }

    const base = (
      process.env.CLOUDINARY_API_BASE ?? "https://api.cloudinary.com/v1_1"
    ).replace(/\/+$/, "");
    const folder = (
      process.env.CLOUDINARY_FOLDER ?? "fundordonate/campaigns"
    ).replace(/^\/+|\/+$/g, "");
    const resourceType = mimeType.startsWith("video/") ? "video" : "image";
    const publicId = `${folder}/${campaignId}/${fileName.replace(/\.[^.]+$/, "")}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = signCloudinaryParams(
      { public_id: publicId, timestamp },
      apiSecret,
    );

    // `form-data` streams the file from disk in chunks, so memory stays flat.
    const form = new FormData();
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("public_id", publicId);
    form.append("signature", signature);
    form.append("file", createReadStream(sourcePath), {
      filename: fileName,
      contentType: mimeType,
    });

    try {
      const response = await axios.post(
        `${base}/${cloudName}/${resourceType}/upload`,
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 60_000,
          validateStatus: () => true,
        },
      );

      if (response.status < 200 || response.status >= 300) {
        this.logger.error(
          `Cloudinary upload rejected (${response.status}): ${String(
            response.data ?? "",
          ).slice(0, 500)}`,
        );
        throw new ServiceUnavailableException(
          "Media storage rejected this file. Please try again.",
        );
      }

      const body = response.data as {
        secure_url?: string;
        public_id?: string;
        bytes?: number;
      } | null;

      if (!body?.secure_url) {
        this.logger.error("Cloudinary upload returned no secure_url.");
        throw new ServiceUnavailableException(
          "Media storage returned an unexpected response.",
        );
      }

      return {
        url: body.secure_url,
        provider: "cloudinary",
        publicId: body.public_id,
        bytes: body.bytes ?? 0,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Cloudinary upload failed: ${message}`);
      throw new ServiceUnavailableException(
        "Media storage is temporarily unavailable. Please try again.",
      );
    }
  }

  /** Best-effort removal of staging files older than an hour. */
  private async pruneTempUploads(): Promise<void> {
    const directory = uploadsTempDir();
    let entries: string[];
    try {
      entries = await readdir(directory);
    } catch {
      return; // no temp dir yet
    }

    const cutoff = Date.now() - 60 * 60 * 1000;
    await Promise.all(
      entries.map(async (entry) => {
        const filePath = join(directory, entry);
        try {
          const info = await stat(filePath);
          if (info.isFile() && info.mtimeMs < cutoff) await unlink(filePath);
        } catch {
          // ignore races
        }
      }),
    );
  }
}
