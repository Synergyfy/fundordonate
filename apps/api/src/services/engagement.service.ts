import { prisma } from "../lib/prisma";
import { NotFoundError, ForbiddenError } from "../middleware/errorHandler";
import { canUserManageCampaign } from "../middleware/authorization";

// =============================================================================
// Campaign Posts (Updates)
// =============================================================================

export async function createPost(
  campaignId: string,
  userId: string,
  userRole: string,
  data: { title: string; content: string }
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true },
  });

  if (!campaign) throw new NotFoundError("Campaign");

  const access = await canUserManageCampaign(userId, userRole, campaignId);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to create posts on this campaign");
  }

  return prisma.campaignPost.create({
    data: { ...data, campaignId },
  });
}

export async function getPosts(campaignId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.campaignPost.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.campaignPost.count({ where: { campaignId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPostById(postId: string) {
  const post = await prisma.campaignPost.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError("Post");
  return post;
}

export async function updatePost(
  postId: string,
  userId: string,
  userRole: string,
  data: { title?: string; content?: string }
) {
  const post = await prisma.campaignPost.findUnique({
    where: { id: postId },
    include: { campaign: { select: { id: true } } },
  });

  if (!post) throw new NotFoundError("Post");

  const access = await canUserManageCampaign(userId, userRole, post.campaign.id);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to update posts on this campaign");
  }

  return prisma.campaignPost.update({ where: { id: postId }, data });
}

export async function deletePost(postId: string, userId: string, userRole: string) {
  const post = await prisma.campaignPost.findUnique({
    where: { id: postId },
    include: { campaign: { select: { id: true } } },
  });

  if (!post) throw new NotFoundError("Post");

  const access = await canUserManageCampaign(userId, userRole, post.campaign.id);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason || "Not authorized to delete posts on this campaign");
  }

  await prisma.campaignPost.delete({ where: { id: postId } });
}

// =============================================================================
// Comments
// =============================================================================

export async function createComment(
  campaignId: string,
  userId: string,
  data: { content: string; parentId?: string }
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, settings: true },
  });

  if (!campaign) throw new NotFoundError("Campaign");

  const settings = JSON.parse(campaign.settings || "{}");
  if (settings.commentSettings === "disabled") {
    throw new ForbiddenError("Comments are disabled for this campaign");
  }

  if (data.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: data.parentId } });
    if (!parent || parent.campaignId !== campaignId) {
      throw new NotFoundError("Parent comment");
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      campaignId,
      userId,
      parentId: data.parentId || null,
      status: settings.commentSettings === "backers" ? "pending" : "approved",
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
      },
    },
  });

  return comment;
}

export async function getComments(campaignId: string, page = 1, limit = 50, includeAll = false) {
  const skip = (page - 1) * limit;
  const where: Record<string, any> = { campaignId, parentId: null };
  if (!includeAll) where.status = "approved";

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
        },
        replies: {
          where: includeAll ? {} : { status: "approved" },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateComment(
  commentId: string,
  userId: string,
  data: { content: string }
) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError("Comment");
  if (comment.userId !== userId) {
    throw new ForbiddenError("You can only edit your own comments");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: { content: data.content },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
      },
    },
  });
}

export async function deleteComment(commentId: string, userId: string, userRole: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { campaign: { select: { authorId: true } } },
  });
  if (!comment) throw new NotFoundError("Comment");
  if (comment.userId !== userId && comment.campaign.authorId !== userId && userRole !== "admin") {
    throw new ForbiddenError("Not authorized to delete this comment");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}

export async function moderateComment(
  commentId: string,
  status: "approved" | "pending" | "spam"
) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError("Comment");

  return prisma.comment.update({
    where: { id: commentId },
    data: { status },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
      },
    },
  });
}

export async function getPendingComments(campaignId?: string) {
  const where: Record<string, any> = { status: "pending" };
  if (campaignId) where.campaignId = campaignId;

  return prisma.comment.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true, username: true },
      },
      campaign: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
