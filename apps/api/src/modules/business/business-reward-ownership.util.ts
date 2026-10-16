/**
 * Shared helper for scoping the local `RewardIssuance` mirror to the rewards a
 * **business owner** actually earned.
 *
 * A reward issuance is attached to the campaign it was earned on, not to the
 * business that owns the campaign. Contributors who fund a campaign earn their
 * own rewards; the campaign runner (the campaign business's owner) is never
 * eligible for a reward from their own campaign (see
 * `RewardTriggerService.resolveRecipient`).
 *
 * Any "business rewards" read must therefore filter by *recipient identity*,
 * mirroring the consumer ownership logic (`ConsumerService#rewardOwnershipWhere`).
 * Filtering only on `campaignId` wrongly attributes every contributor's reward
 * to the business owner.
 */

export interface BusinessRewardOwnerIdentity {
  /** The business owner's local user id (`Business.ownerId`). */
  userId: string;
  /** Candidate recipient emails (owner's personal email, business email). */
  emails?: Array<string | null | undefined>;
  /** The owner's linked MCOM Central user id, when present. */
  mcomUserId?: string | null;
}

/**
 * Prisma `where` fragment matching only reward issuances earned by the business
 * owner — by owner user id, recipient email, or MCOM user id. Spread it into a
 * `where` alongside `campaignId`/`status` filters; the `OR` is ANDed with the
 * rest.
 */
export function businessRewardOwnershipWhere(
  owner: BusinessRewardOwnerIdentity,
): { OR: Array<Record<string, unknown>> } {
  const or: Array<Record<string, unknown>> = [{ userId: owner.userId }];

  const emails = new Set(
    (owner.emails ?? []).filter((e): e is string => !!e),
  );
  for (const email of emails) {
    or.push({ recipientEmail: email });
  }

  if (owner.mcomUserId) {
    or.push({ mcomUserId: owner.mcomUserId });
  }

  return { OR: or };
}
