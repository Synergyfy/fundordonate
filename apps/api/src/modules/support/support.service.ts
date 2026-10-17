import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SupportTicketStatus } from "@prisma/client";
import { CreateTicketDto } from "./dto/create-ticket.dto";

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string | null, dto: CreateTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: userId ?? undefined,
        name: dto.name,
        email: dto.email,
        topic: dto.topic,
        subject: dto.subject,
        message: dto.message,
        source: dto.source ?? "web",
      },
    });

    return {
      id: ticket.id,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
    };
  }

  async list(params: { page?: number; limit?: number; status?: string } = {}) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const where = params.status
      ? { status: params.status.toUpperCase() as SupportTicketStatus }
      : {};

    const [total, items] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        userId: t.userId,
        name: t.name,
        email: t.email,
        topic: t.topic,
        subject: t.subject,
        message: t.message,
        status: t.status,
        source: t.source,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Support ticket ${id} not found`);

    const value = status.toUpperCase() as SupportTicketStatus;
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: (Object.values(SupportTicketStatus) as string[]).includes(value)
          ? value
          : existing.status,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
