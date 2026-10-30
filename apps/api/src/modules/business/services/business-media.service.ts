import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { promises as dns } from "node:dns";
import { mkdir, open, stat, unlink, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { join } from "node:path";
import { PrismaService } from "@/prisma/prisma.service";
import { uploadsTempDir } from "@/common/uploads";
import { BusinessCampaignStatus } from "@prisma/client";
import { MediaStorageService } from "./media-storage.service";

/** Uploaded/remote media we accept, with the hard size ceiling per type. */
const ALLOWED_MEDIA: Record<
  string,
  { ext: string; family: "image" | "video"; maxBytes: number }
> = {
  "image/jpeg": { ext: ".jpg", family: "image", maxBytes: 10 * 1024 * 1024 },
  "image/png": { ext: ".png", family: "image", maxBytes: 10 * 1024 * 1024 },
  "image/webp": { ext: ".webp", family: "image", maxBytes: 10 * 1024 * 1024 },
  "image/gif": { ext: ".gif", family: "image", maxBytes: 10 * 1024 * 1024 },
  "image/avif": { ext: ".avif", family: "image", maxBytes: 10 * 1024 * 1024 },
  "video/mp4": { ext: ".mp4", family: "video", maxBytes: 50 * 1024 * 1024 },
  "video/webm": { ext: ".webm", family: "video", maxBytes: 50 * 1024 * 1024 },
  "video/quicktime": { ext: ".mov", family: "video", maxBytes: 50 * 1024 * 1024 },
};

/** Multer's hard cap; per-type limits above are stricter. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
];

/** Reject obviously-unroutable / internal IPv4 ranges (SSRF defence). */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === "::1" || value === "::") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true; // unique local
  if (value.startsWith("fe80")) return true; // link local
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

/** True when the literal address is loopback/private/link-local/reserved. */
export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

/** Magic-byte sniffing so a `.jpg` cannot smuggle an executable/HTML payload. */
export function sniffMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  const ascii4 = buffer.subarray(0, 4).toString("ascii");
  if (ascii4 === "GIF8") return "image/gif";
  if (
    ascii4 === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "qt  ") return "video/quicktime";
    return "video/mp4";
  }
  return null;
}

/** Reads only the first N bytes of a file (never the whole thing). */
async function readHeader(filePath: string, bytes = 32): Promise<Buffer> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

@Injectable()
export class BusinessMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
  ) {}

  /** The campaign must belong to the business and still be editable. */
  private async assertEditableCampaign(businessId: string, campaignId: string) {
    const campaign = await this.prisma.businessCampaign.findFirst({
      where: { id: campaignId, businessId },
      select: { id: true, status: true },
    });
    if (!campaign) {
      throw new BadRequestException("Campaign not found");
    }
    if (
      campaign.status !== BusinessCampaignStatus.DRAFT &&
      campaign.status !== BusinessCampaignStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        "Media can only be changed while the campaign is a draft or has changes requested.",
      );
    }
    return campaign;
  }

  /**
   * Validates and stores an uploaded image/video.
   *
   * The raw body is staged on disk by multer (`file.path`); the magic-byte
   * check and the Cloudinary request both stream from that file, so a 50MB
   * upload never sits in the Node heap. The staging file is always removed,
   * including on failure.
   */
  async uploadFile(
    businessId: string,
    campaignId: string,
    file: {
      path?: string;
      buffer?: Buffer;
      mimetype?: string;
      size?: number;
      originalname?: string;
    },
  ): Promise<{
    url: string;
    mimeType: string;
    size: number;
    provider: "local" | "cloudinary";
  }> {
    await this.assertEditableCampaign(businessId, campaignId);

    let stagedPath = file?.path;
    const buffer = file?.buffer;

    if (!stagedPath) {
      if (!buffer?.length) {
        throw new BadRequestException("No file was uploaded.");
      }
      // Non-multipart callers / tests: stage the buffer once, then use the
      // same file-based pipeline.
      const directory = uploadsTempDir();
      await mkdir(directory, { recursive: true });
      stagedPath = join(directory, `buffer-${randomUUID()}`);
      await writeFile(stagedPath, buffer);
    }

    try {
      const declared = (file.mimetype ?? "").toLowerCase();
      const allowed = ALLOWED_MEDIA[declared];
      if (!allowed) {
        throw new BadRequestException(
          "Unsupported file type. Upload a JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM or MOV file.",
        );
      }

      if (file.size && file.size > allowed.maxBytes) {
        throw new PayloadTooLargeException(this.tooLargeMessage(allowed));
      }

      const sniffed = sniffMime(await readHeader(stagedPath));
      if (!sniffed || ALLOWED_MEDIA[sniffed]?.family !== allowed.family) {
        throw new BadRequestException(
          "This file's contents do not match its type. Upload a real image or video file.",
        );
      }

      const finalType = ALLOWED_MEDIA[sniffed] ?? allowed;
      const { size: finalSize } = await stat(stagedPath);
      if (finalSize > finalType.maxBytes) {
        throw new PayloadTooLargeException(
          `The ${finalType.family} is larger than ${Math.round(
            finalType.maxBytes / (1024 * 1024),
          )}MB. Try a smaller file.`,
        );
      }
      if (finalSize === 0) {
        throw new BadRequestException("The uploaded file was empty.");
      }

      const stored = await this.storage.store({
        sourcePath: stagedPath,
        mimeType: sniffed,
        fileName: `${randomUUID()}${finalType.ext}`,
        campaignId,
      });

      return {
        url: stored.url,
        mimeType: sniffed,
        size: stored.bytes || finalSize,
        provider: stored.provider,
      };
    } finally {
      // Staging (multer) is always cleaned up.
      if (stagedPath) await unlink(stagedPath).catch(() => undefined);
    }
  }

  private tooLargeMessage(allowed: { family: "image" | "video"; maxBytes: number }) {
    return `File is too large. ${allowed.family === "image" ? "Images" : "Videos"} must be under ${Math.round(
      allowed.maxBytes / (1024 * 1024),
    )}MB.`;
  }

  /**
   * Shallow (no DNS, no network) safety check used when saving answers: the
   * value must be our own upload path or an http(s) URL that does not point at
   * a private/local address.
   */
  assertShallowSafeValue(value: string): void {
    const lines = value
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (line.startsWith("/uploads/")) continue;

      let parsed: URL;
      try {
        parsed = new URL(line);
      } catch {
        throw new BadRequestException(
          `"${line}" is not a valid link. Upload a file or use an http(s) link.`,
        );
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new BadRequestException(
          "Only http(s) links or uploaded files are allowed.",
        );
      }
      if (parsed.username || parsed.password) {
        throw new BadRequestException("Links with embedded credentials are not allowed.");
      }

      const host = parsed.hostname.toLowerCase();
      if (
        BLOCKED_HOSTNAMES.includes(host) ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal") ||
        host.endsWith(".home.arpa")
      ) {
        throw new BadRequestException("That link points to an internal address.");
      }
      // WHATWG URLs keep IPv6 literals bracketed (`[::1]`).
      const bareHost = host.replace(/^\[|\]$/g, "");
      if (isIP(bareHost) && isPrivateAddress(bareHost)) {
        throw new BadRequestException("That link points to a private address.");
      }
    }
  }

  /**
   * Verifies a remote image/video link: resolves DNS (rejecting internal
   * targets), follows a bounded number of redirects, and checks the response
   * content type and size.
   */
  async verifyRemoteLink(
    businessId: string,
    campaignId: string,
    rawUrl: string,
  ): Promise<{ url: string; contentType: string; size: number | null }> {
    await this.assertEditableCampaign(businessId, campaignId);

    const trimmed = (rawUrl ?? "").trim();
    if (!trimmed) {
      throw new BadRequestException("Enter a link to an image or video.");
    }
    if (trimmed.length > 2048) {
      throw new BadRequestException("That link is too long.");
    }

    this.assertShallowSafeValue(trimmed);

    const url = new URL(trimmed);
    await this.assertResolvablePublicHost(url.hostname);

    const response = await this.fetchWithTimeout(url);
    const finalUrl = new URL(response.url || url.toString());
    await this.assertResolvablePublicHost(finalUrl.hostname);

    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const allowed = ALLOWED_MEDIA[contentType];
    if (!allowed) {
      throw new BadRequestException(
        `That link is not an image or video (content type: ${contentType || "unknown"}).`,
      );
    }

    const lengthHeader = response.headers.get("content-length");
    const size = lengthHeader ? Number(lengthHeader) : null;
    if (size && size > allowed.maxBytes) {
      throw new BadRequestException(
        `That ${allowed.family} is larger than ${Math.round(
          allowed.maxBytes / (1024 * 1024),
        )}MB.`,
      );
    }

    return { url: finalUrl.toString(), contentType, size };
  }

  /** DNS lookup that refuses hosts resolving to internal addresses. */
  private async assertResolvablePublicHost(hostname: string): Promise<void> {
    const host = hostname.toLowerCase();
    const bareHost = host.replace(/^\[|\]$/g, "");

    if (isIP(bareHost)) {
      if (isPrivateAddress(bareHost)) {
        throw new BadRequestException("That link points to a private address.");
      }
      return;
    }

    let records: { address: string }[];
    try {
      records = await dns.lookup(host, { all: true, verbatim: true });
    } catch {
      throw new BadRequestException("That link's host could not be resolved.");
    }

    if (records.length === 0) {
      throw new BadRequestException("That link's host could not be resolved.");
    }
    if (records.some((record) => isPrivateAddress(record.address))) {
      throw new BadRequestException("That link points to a private address.");
    }
  }

  /** HEAD, falling back to a ranged GET for servers that reject HEAD. */
  private async fetchWithTimeout(url: URL): Promise<Response> {
    const signal = AbortSignal.timeout(6000);
    const headers = { "user-agent": "FundOrDonate-MediaCheck/1.0" };

    try {
      const head = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal,
        headers,
      });
      if (head.ok) return head;
    } catch {
      // fall through to the ranged GET
    }

    try {
      return await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal,
        headers: { ...headers, range: "bytes=0-0" },
      });
    } catch {
      throw new BadRequestException(
        "That link could not be reached. Check it is public and try again.",
      );
    }
  }
}
