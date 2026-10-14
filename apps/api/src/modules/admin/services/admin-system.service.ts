import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import {
  AuditLogQueryDto,
  CreateEventDto,
  EventsQueryDto,
  UpdateEventDto,
  UpdateSettingsDto,
} from "../dto/system-admin.dto";
import { REDIS_CLIENT } from "@/redis/redis.constants";
import Redis from "ioredis";

@Injectable()
export class AdminSystemService {
  private readonly logger = new Logger(AdminSystemService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Retrieves a paginated list of platform events.
   */
  async getEvents(query: EventsQueryDto) {
    const { page = 1, limit = 20, scope, locationId, isPublished, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PlatformEventWhereInput = {};

    if (scope) {
      where.scope = scope;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.platformEvent.count({ where }),
      this.prisma.platformEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { eventDate: "asc" },
        include: {
          location: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single event detail.
   */
  async getEvent(id: string) {
    const event = await this.prisma.platformEvent.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * Creates a new platform event.
   */
  async createEvent(dto: CreateEventDto) {
    return this.prisma.platformEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        scope: dto.scope,
        locationId: dto.locationId,
        eventDate: new Date(dto.eventDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        venue: dto.venue,
        isPublished: dto.isPublished ?? true,
        metadata: dto.metadata ?? {},
      },
    });
  }

  /**
   * Updates an existing platform event.
   */
  async updateEvent(id: string, dto: UpdateEventDto) {
    const event = await this.prisma.platformEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const data: Prisma.PlatformEventUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.scope !== undefined) data.scope = dto.scope;
    if (dto.locationId !== undefined) {
      data.location = dto.locationId ? { connect: { id: dto.locationId } } : { disconnect: true };
    }
    if (dto.eventDate !== undefined) data.eventDate = new Date(dto.eventDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.venue !== undefined) data.venue = dto.venue;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    return this.prisma.platformEvent.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a platform event.
   */
  async deleteEvent(id: string) {
    const event = await this.prisma.platformEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    await this.prisma.platformEvent.delete({ where: { id } });
    return { success: true, deletedId: id };
  }

  /**
   * Retrieves platform settings map, filtered optionally by category.
   * Cached in Redis for 600 seconds.
   */
  async getSettings(category?: string) {
    const cacheKey = `admin:settings:${category || "all"}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err: any) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${err.message}`);
    }

    const where: Prisma.PlatformSettingWhereInput = {};
    if (category) {
      where.category = category;
    }

    const records = await this.prisma.platformSetting.findMany({ where });

    const settingsMap: Record<string, any> = {};
    for (const r of records) {
      settingsMap[r.key] = r.value;
    }

    // Default fallbacks if empty
    if (Object.keys(settingsMap).length === 0) {
      settingsMap["platform_fee_percent"] = 5.0;
      settingsMap["payout_schedule"] = "weekly";
      settingsMap["min_donation_pence"] = 100;
      settingsMap["auto_approve_campaigns"] = false;
      settingsMap["support_email"] = "support@fundordonate.com";
    }

    try {
      await this.redis.set(cacheKey, JSON.stringify(settingsMap), "EX", 600);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${err.message}`);
    }

    return settingsMap;
  }

  /**
   * Updates platform settings and invalidates cache.
   */
  async updateSettings(dto: UpdateSettingsDto) {
    const entries = Object.entries(dto.settings);

    for (const [key, value] of entries) {
      await this.prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          value,
          category: key.includes("payment") || key.includes("fee") ? "payment" : "general",
        },
      });
    }

    // Invalidate settings caches
    try {
      const keys = await this.redis.keys("admin:settings:*");
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to clear settings cache: ${err.message}`);
    }

    return this.getSettings();
  }

  /**
   * Retrieves a paginated list of audit logs.
   */
  async getAuditLogs(query: AuditLogQueryDto) {
    const { page = 1, limit = 20, entityType, entityId, userId, action, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: "insensitive" };

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
