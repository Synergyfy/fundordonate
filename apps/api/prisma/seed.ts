import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// =============================================================================
// Seed Data — FundOrDonate Development/Demo Data
// This data is for development, presentation, and authorization testing.
// It must NOT be treated as production business rules.
// =============================================================================

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// =============================================================================
// Users
// =============================================================================

async function seedUsers() {
  console.log("Seeding users...");

  const password = await hashPassword("password123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@growfund.io" },
    update: {},
    create: {
      email: "admin@growfund.io",
      username: "admin",
      password,
      firstName: "Sarah",
      lastName: "Mitchell",
      role: "admin",
      userType: "admin",
      emailVerified: true,
    },
  });

  const fundraiser = await prisma.user.upsert({
    where: { email: "fundraiser@growfund.io" },
    update: {},
    create: {
      email: "fundraiser@growfund.io",
      username: "fundraiser",
      password,
      firstName: "James",
      lastName: "Rodriguez",
      role: "fundraiser",
      userType: "business",
      businessId: "B-1001",
      emailVerified: true,
    },
  });

  const fundraiser2 = await prisma.user.upsert({
    where: { email: "fundraiser2@growfund.io" },
    update: {},
    create: {
      email: "fundraiser2@growfund.io",
      username: "fundraiser2",
      password,
      firstName: "Priya",
      lastName: "Sharma",
      role: "fundraiser",
      userType: "business",
      businessId: "B-1002",
      emailVerified: true,
    },
  });

  const consumer = await prisma.user.upsert({
    where: { email: "user@growfund.io" },
    update: {},
    create: {
      email: "user@growfund.io",
      username: "user",
      password,
      firstName: "Emily",
      lastName: "Watson",
      role: "donor",
      userType: "consumer",
      emailVerified: true,
    },
  });

  const collaborator = await prisma.user.upsert({
    where: { email: "collaborator@growfund.io" },
    update: {},
    create: {
      email: "collaborator@growfund.io",
      username: "collaborator",
      password,
      firstName: "David",
      lastName: "Chen",
      role: "collaborator",
      userType: "consumer",
      emailVerified: true,
    },
  });

  const backer = await prisma.user.upsert({
    where: { email: "backer@growfund.io" },
    update: {},
    create: {
      email: "backer@growfund.io",
      username: "backer",
      password,
      firstName: "Olivia",
      lastName: "Brown",
      role: "backer",
      userType: "consumer",
      emailVerified: true,
    },
  });

  return { admin, fundraiser, fundraiser2, consumer, collaborator, backer };
}

// =============================================================================
// Categories
// =============================================================================

async function seedCategories() {
  console.log("Seeding categories...");

  const categories = [
    { name: "Community", slug: "community", description: "Local community projects and initiatives", order: 1 },
    { name: "Local Hub", slug: "local-hub", description: "Neighbourhood hub development and support", order: 2 },
    { name: "Business", slug: "business", description: "Business funding and growth campaigns", order: 3 },
    { name: "High Street", slug: "high-street", description: "High street regeneration and support", order: 4 },
    { name: "Education", slug: "education", description: "Educational programmes and resources", order: 5 },
    { name: "Health", slug: "health", description: "Health and wellbeing initiatives", order: 6 },
    { name: "Founding Membership", slug: "founding-membership", description: "Founding membership campaigns", order: 7 },
    { name: "MCOM Rewards", slug: "mcom-rewards", description: "MCOM reward and loyalty campaigns", order: 8 },
  ];

  const results = [];
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      results.push(await prisma.category.create({ data: cat }));
    } else {
      results.push(existing);
    }
  }
  return results;
}

// =============================================================================
// Tags
// =============================================================================

async function seedTags() {
  console.log("Seeding tags...");

  const tagNames = [
    "Local Hub", "High Street", "Business", "Community", "MCOM",
    "Rewards", "Loyalty", "Backer Status", "Founding Membership",
    "Partner Hub", "76 City Hubs", "Cost-Neutral",
  ];

  const results = [];
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
    const existing = await prisma.tag.findUnique({ where: { slug } });
    if (!existing) {
      results.push(await prisma.tag.create({ data: { name, slug } }));
    } else {
      results.push(existing);
    }
  }
  return results;
}

// =============================================================================
// Campaign Types
// =============================================================================

async function seedCampaignTypes() {
  console.log("Seeding campaign types...");

  const types = [
    { name: "Local Hub", slug: "local-hub", description: "Neighbourhood hub campaigns", status: "active" as const },
    { name: "Business", slug: "business", description: "Business funding campaigns", status: "active" as const },
    { name: "Community", slug: "community", description: "Community initiative campaigns", status: "active" as const },
    { name: "High Street", slug: "high-street", description: "High street regeneration campaigns", status: "active" as const },
    { name: "Membership", slug: "membership", description: "Membership-based campaigns", status: "active" as const },
    // Campaign Architecture: Opportunity Types
    { name: "Founding Membership", slug: "founding-membership", description: "Consumer founding membership drives", status: "active" as const, isOpportunity: true, eligibleTiers: '["silver","gold","platinum"]', eligibleLevels: '["standard","pro","pro+"]', parentInitiative: "MCOM Programme" },
    { name: "Self-Funding", slug: "self-funding", description: "Business owner self-funding campaigns", status: "active" as const, isOpportunity: true, eligibleTiers: '["bronze","silver","gold","platinum"]', eligibleLevels: '["standard","pro","pro+"]', parentInitiative: "Self-Funding" },
    { name: "Sponsorship", slug: "sponsorship", description: "Sponsor-level partnership campaigns", status: "active" as const, isOpportunity: true, eligibleTiers: '["gold","platinum"]', eligibleLevels: '["pro","pro+"]', parentInitiative: "Sponsor Network" },
    { name: "MCOM Programme", slug: "mcom-programme", description: "National MCOM Community Cost-Neutral Funding", status: "active" as const, isOpportunity: true, eligibleTiers: '["bronze","silver","gold","platinum"]', eligibleLevels: '["standard","pro","pro+"]', parentInitiative: "MCOM Programme" },
    { name: "247GBS Programme", slug: "247gbs", description: "247GBS 76 UK City Hubs initiative", status: "active" as const, isOpportunity: true, eligibleTiers: '["silver","gold","platinum"]', eligibleLevels: '["pro","pro+"]', parentInitiative: "247GBS" },
  ];

  const results = [];
  for (const type of types) {
    const existing = await prisma.campaignType.findUnique({ where: { slug: type.slug } });
    if (!existing) {
      results.push(await prisma.campaignType.create({ data: type }));
    } else {
      // Update with new fields if missing
      if (existing.isOpportunity === false && (type as any).isOpportunity) {
        const updated = await prisma.campaignType.update({
          where: { id: existing.id },
          data: {
            isOpportunity: (type as any).isOpportunity || false,
            eligibleTiers: (type as any).eligibleTiers || '[]',
            eligibleLevels: (type as any).eligibleLevels || '[]',
            parentInitiative: (type as any).parentInitiative || null,
          },
        });
        results.push(updated);
      } else {
        results.push(existing);
      }
    }
  }
  return results;
}

// =============================================================================
// Campaign Seasons
// =============================================================================

async function seedSeasons() {
  console.log("Seeding campaign seasons...");

  const seasons = [
    {
      name: "Spring 2026",
      slug: "spring-2026",
      description: "Spring 2026 campaign season",
      startDate: new Date("2026-03-20"),
      endDate: new Date("2026-06-20"),
      status: "active" as const,
    },
    {
      name: "Summer 2026",
      slug: "summer-2026",
      description: "Summer 2026 campaign season",
      startDate: new Date("2026-06-21"),
      endDate: new Date("2026-09-22"),
      status: "upcoming" as const,
    },
    {
      name: "Christmas 2026",
      slug: "christmas-2026",
      description: "Christmas 2026 campaign season",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-12-31"),
      status: "upcoming" as const,
    },
  ];

  const results = [];
  for (const season of seasons) {
    const existing = await prisma.campaignSeason.findUnique({ where: { slug: season.slug } });
    if (!existing) {
      results.push(await prisma.campaignSeason.create({ data: season }));
    } else {
      results.push(existing);
    }
  }
  return results;
}

// =============================================================================
// Campaign Groups
// =============================================================================

async function seedGroups() {
  console.log("Seeding campaign groups...");

  const groups = [
    { name: "Christmas Campaigns", slug: "christmas-campaigns", description: "Seasonal Christmas campaigns" },
    { name: "Back-to-School", slug: "back-to-school", description: "Back-to-school fundraising campaigns" },
    { name: "Local Business Spotlight", slug: "local-business-spotlight", description: "Featured local business campaigns" },
    { name: "Community Champions", slug: "community-champions", description: "Outstanding community initiative campaigns" },
  ];

  const results = [];
  for (const group of groups) {
    const existing = await prisma.campaignGroup.findUnique({ where: { slug: group.slug } });
    if (!existing) {
      results.push(await prisma.campaignGroup.create({ data: group }));
    } else {
      results.push(existing);
    }
  }
  return results;
}

// =============================================================================
// Campaign Collections
// =============================================================================

async function seedCollections() {
  console.log("Seeding campaign collections...");

  const collections = [
    { name: "Featured UK Business Funding", slug: "featured-uk-business-funding", description: "Curated selection of top UK business funding opportunities" },
    { name: "Community Champions", slug: "community-champions-collection", description: "Outstanding community-driven campaigns" },
    { name: "Editor's Pick", slug: "editors-pick", description: "Hand-picked campaigns by the FundorDonate team" },
  ];

  const results = [];
  for (const collection of collections) {
    const existing = await prisma.campaignCollection.findUnique({ where: { slug: collection.slug } });
    if (!existing) {
      results.push(await prisma.campaignCollection.create({ data: collection }));
    } else {
      results.push(existing);
    }
  }
  return results;
}

// =============================================================================
// Campaign Events
// =============================================================================

async function seedEvents() {
  console.log("Seeding campaign events...");

  const events = [
    {
      name: "FundOrDonate Launch Event",
      slug: "fundordonate-launch",
      description: "Official launch of the FundorDonate platform",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-09-30"),
    },
    {
      name: "Small Business Week 2026",
      slug: "small-business-week-2026",
      description: "Celebrating small businesses across the UK",
      startDate: new Date("2026-10-06"),
      endDate: new Date("2026-10-12"),
    },
  ];

  const results = [];
  for (const event of events) {
    const existing = await prisma.campaignEvent.findUnique({ where: { slug: event.slug } });
    if (!existing) {
      results.push(await prisma.campaignEvent.create({ data: event }));
    } else {
      results.push(existing);
    }
  }
  return results;
}

// =============================================================================
// Campaigns
// =============================================================================

async function seedCampaigns(
  users: Awaited<ReturnType<typeof seedUsers>>,
  categories: Awaited<ReturnType<typeof seedCategories>>,
  tags: Awaited<ReturnType<typeof seedTags>>,
  campaignTypes: Awaited<ReturnType<typeof seedCampaignTypes>>,
  seasons: Awaited<ReturnType<typeof seedSeasons>>,
  groups: Awaited<ReturnType<typeof seedGroups>>,
  collections: Awaited<ReturnType<typeof seedCollections>>,
  events: Awaited<ReturnType<typeof seedEvents>>,
) {
  console.log("Seeding campaigns...");

  const { admin, fundraiser, fundraiser2, collaborator } = users;
  const [communityCat, localHubCat, businessCat, highStreetCat, , , foundingMembershipCat] = categories;
  const [localHubType, businessType, communityType, highStreetType] = campaignTypes;
  const [springSeason] = seasons;
  const [christmasGroup] = groups;
  const [featuredCollection] = collections;
  const [launchEvent] = events;

  const now = new Date();
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const threeMonthsFromNow = new Date(now);
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const campaignsData = [
    // === ADMIN CAMPAIGNS ===
    {
      title: "FundorDonate Platform Launch",
      slug: "fundordonate-platform-launch",
      shortDescription: "Official launch campaign for the FundorDonate crowdfunding platform",
      description: "Help us launch FundorDonate, the UK's newest crowdfunding and donation platform designed to bring communities together.",
      goalAmount: 5000000, // £50,000
      raisedAmount: 3750000,
      deadline: threeMonthsFromNow,
      status: "active",
      mode: "fund",
      authorId: admin.id,
      creatorType: "admin",
      categoryId: communityCat.id,
      campaignTypeId: communityType.id,
      seasonId: springSeason.id,
      featuredImage: "/images/campaigns/fundordonate-launch.jpg",
      ownerContribution: 1000000,
    },
    {
      title: "London Community Christmas Appeal",
      slug: "london-community-christmas-appeal",
      shortDescription: "Annual Christmas appeal supporting London communities",
      description: "Our annual Christmas appeal brings together local businesses and community members to support those in need during the festive season.",
      goalAmount: 10000000,
      raisedAmount: 0,
      deadline: new Date("2026-12-31"),
      status: "draft",
      mode: "donation",
      authorId: admin.id,
      creatorType: "admin",
      categoryId: communityCat.id,
    },
    {
      title: "Platform Safety Review",
      slug: "platform-safety-review",
      shortDescription: "Internal platform safety and compliance review campaign",
      description: "This campaign is under internal review for compliance and safety checks before public launch.",
      goalAmount: 200000,
      raisedAmount: 0,
      deadline: oneMonthFromNow,
      status: "pending_review",
      mode: "donation",
      authorId: admin.id,
      creatorType: "admin",
      categoryId: businessCat.id,
    },
    {
      title: "MCOM Integration Beta",
      slug: "mcom-integration-beta",
      shortDescription: "Beta testing campaign for MCOM integration features",
      description: "This campaign has been approved for beta testing of the MCOM integration features including VCard and Terminal support.",
      goalAmount: 500000,
      raisedAmount: 125000,
      deadline: threeMonthsFromNow,
      status: "approved",
      mode: "sponsor",
      authorId: admin.id,
      creatorType: "admin",
      categoryId: businessCat.id,
    },
    {
      title: "Pilot Hub Campaign",
      slug: "pilot-hub-campaign",
      shortDescription: "Completed pilot hub campaign for testing lifecycle",
      description: "This campaign completed its funding goal and is now in the completed state for lifecycle testing.",
      goalAmount: 1000000,
      raisedAmount: 1000000,
      deadline: threeMonthsAgo,
      status: "completed",
      mode: "fund",
      authorId: admin.id,
      creatorType: "admin",
      categoryId: localHubCat.id,
      campaignTypeId: localHubType.id,
    },
    {
      title: "Archived Test Campaign",
      slug: "archived-test-campaign",
      shortDescription: "Test campaign in archived state",
      description: "This campaign was archived for testing the trash and restore functionality.",
      goalAmount: 300000,
      raisedAmount: 0,
      deadline: threeMonthsAgo,
      status: "archived",
      mode: "donation",
      authorId: admin.id,
      creatorType: "admin",
      categoryId: communityCat.id,
    },
    {
      title: "Rejected Campaign Example",
      slug: "rejected-campaign-example",
      shortDescription: "Campaign rejected for policy violation",
      description: "This campaign was rejected during the review process for failing to meet platform guidelines.",
      goalAmount: 500000,
      raisedAmount: 0,
      deadline: oneMonthFromNow,
      status: "rejected",
      mode: "donation",
      authorId: admin.id,
      creatorType: "admin",
      categoryId: communityCat.id,
      rejectionReason: "Campaign description does not meet community guidelines. Please revise and resubmit.",
    },
    // === FUNDRAISER (BUSINESS) CAMPAIGNS ===
    {
      title: "Camden High Street Revival",
      slug: "camden-high-street-revival",
      shortDescription: "Revitalising Camden's high street through community investment",
      description: "Join us in bringing new life to Camden's iconic high street with independent shops, community spaces, and cultural events.",
      goalAmount: 8000000,
      raisedAmount: 5600000,
      deadline: threeMonthsFromNow,
      status: "active",
      mode: "fund",
      authorId: fundraiser.id,
      creatorType: "business",
      categoryId: highStreetCat.id,
      campaignTypeId: highStreetType?.id,
      seasonId: springSeason.id,
      featuredImage: "/images/campaigns/camden-high-street.jpg",
      ownerContribution: 2000000,
    },
    {
      title: "Islington Community Hub",
      slug: "islington-community-hub",
      shortDescription: "Creating a new community hub in Islington",
      description: "A brand new community hub for Islington residents featuring co-working spaces, youth programmes, and health services.",
      goalAmount: 6000000,
      raisedAmount: 4200000,
      deadline: threeMonthsFromNow,
      status: "published",
      mode: "fund",
      authorId: fundraiser.id,
      creatorType: "business",
      categoryId: localHubCat.id,
      campaignTypeId: localHubType?.id,
      featuredImage: "/images/campaigns/islington-hub.jpg",
    },
    {
      title: "Southwark Youth Programme",
      slug: "southwark-youth-programme",
      shortDescription: "Youth development programme in Southwark",
      description: "Supporting young people in Southwark through mentorship, skills training, and employment opportunities.",
      goalAmount: 3000000,
      raisedAmount: 900000,
      deadline: threeMonthsFromNow,
      status: "submitted",
      mode: "donation",
      authorId: fundraiser.id,
      creatorType: "business",
      categoryId: communityCat.id,
    },
    {
      title: "Sponsor a Local Business",
      slug: "sponsor-local-business",
      shortDescription: "Sponsorship campaign for local business growth",
      description: "Become a sponsor for local businesses and help them grow while gaining visibility in your community.",
      goalAmount: 2000000,
      raisedAmount: 400000,
      deadline: threeMonthsFromNow,
      status: "paused",
      mode: "sponsor",
      authorId: fundraiser.id,
      creatorType: "business",
      categoryId: businessCat.id,
    },
    // === CAMPAIGN WITH COLLABORATOR ===
    {
      title: "Hackney Community Garden",
      slug: "hackney-community-garden",
      shortDescription: "Building a community garden in Hackney",
      description: "Creating a shared green space for Hackney residents to grow food, learn about sustainability, and build community connections.",
      goalAmount: 1500000,
      raisedAmount: 750000,
      deadline: threeMonthsFromNow,
      status: "active",
      mode: "fund",
      authorId: fundraiser.id,
      creatorType: "business",
      categoryId: communityCat.id,
      featuredImage: "/images/campaigns/hackney-garden.jpg",
    },
    // === FUNDRAISER 2 CAMPAIGNS ===
    {
      title: "Westminster Business Incubator",
      slug: "westminster-business-incubator",
      shortDescription: "Business incubator for Westminster startups",
      description: "Supporting the next generation of Westminster startups with workspace, mentoring, and access to networks.",
      goalAmount: 12000000,
      raisedAmount: 3600000,
      deadline: threeMonthsFromNow,
      status: "active",
      mode: "fund",
      authorId: fundraiser2.id,
      creatorType: "business",
      categoryId: businessCat.id,
      campaignTypeId: businessType?.id,
      featuredImage: "/images/campaigns/westminster-incubator.jpg",
      ownerContribution: 3000000,
    },
    {
      title: "Greenwich Digital Skills",
      slug: "greenwich-digital-skills",
      shortDescription: "Digital skills training for Greenwich residents",
      description: "Bridging the digital divide in Greenwich through free coding workshops, device lending, and digital literacy programmes.",
      goalAmount: 2000000,
      raisedAmount: 1800000,
      deadline: threeMonthsFromNow,
      status: "active",
      mode: "donation",
      authorId: fundraiser2.id,
      creatorType: "business",
      categoryId: communityCat.id,
    },
  ];

  const results = [];
  for (const data of campaignsData) {
    const existing = await prisma.campaign.findUnique({ where: { slug: data.slug } });
    if (!existing) {
      const campaign = await prisma.campaign.create({
        data: {
          ...data,
          deadline: data.deadline,
          settings: "{}",
        },
      });
      results.push(campaign);
    } else {
      results.push(existing);
    }
  }

  // === TAG ASSOCIATIONS ===
  const tagAssociations = [
    { campaignSlug: "fundordonate-platform-launch", tagSlugs: ["community", "local-hub", "mcom"] },
    { campaignSlug: "camden-high-street-revival", tagSlugs: ["high-street", "business", "local-hub"] },
    { campaignSlug: "islington-community-hub", tagSlugs: ["local-hub", "community", "76-city-hubs"] },
    { campaignSlug: "hackney-community-garden", tagSlugs: ["community", "cost-neutral"] },
    { campaignSlug: "westminster-business-incubator", tagSlugs: ["business", "partner-hub"] },
    { campaignSlug: "greenwich-digital-skills", tagSlugs: ["community", "loyalty"] },
  ];

  for (const assoc of tagAssociations) {
    const campaign = results.find((c) => c.slug === assoc.campaignSlug);
    if (!campaign) continue;

    for (const tagSlug of assoc.tagSlugs) {
      const tag = tags.find((t) => t.slug === tagSlug);
      if (!tag) continue;

      const existing = await prisma.campaignTag.findUnique({
        where: { campaignId_tagId: { campaignId: campaign.id, tagId: tag.id } },
      });
      if (!existing) {
        await prisma.campaignTag.create({
          data: { campaignId: campaign.id, tagId: tag.id },
        });
      }
    }
  }

  // === COLLABORATOR ASSOCIATION ===
  const hackneyCampaign = results.find((c) => c.slug === "hackney-community-garden");
  if (hackneyCampaign) {
    const existingCollab = await prisma.campaignCollaborator.findUnique({
      where: { campaignId_collaboratorId: { campaignId: hackneyCampaign.id, collaboratorId: collaborator.id } },
    });
    if (!existingCollab) {
      await prisma.campaignCollaborator.create({
        data: { campaignId: hackneyCampaign.id, collaboratorId: collaborator.id },
      });
      console.log(`  Added collaborator ${collaborator.firstName} to "${hackneyCampaign.title}"`);
    }
  }

  // === GROUP MEMBERSHIP ===
  const christmasGroupData = groups.find((g) => g.slug === "christmas-campaigns");
  const christmasCampaign = results.find((c) => c.slug === "london-community-christmas-appeal");
  if (christmasGroupData && christmasCampaign) {
    const existingMembership = await prisma.campaignGroupMembership.findUnique({
      where: { campaignId_groupId: { campaignId: christmasCampaign.id, groupId: christmasGroupData.id } },
    });
    if (!existingMembership) {
      await prisma.campaignGroupMembership.create({
        data: { campaignId: christmasCampaign.id, groupId: christmasGroupData.id },
      });
    }
  }

  // === COLLECTION MEMBERSHIP ===
  const featuredCollectionData = collections.find((c) => c.slug === "featured-uk-business-funding");
  const westminsterCampaign = results.find((c) => c.slug === "westminster-business-incubator");
  if (featuredCollectionData && westminsterCampaign) {
    const existingMembership = await prisma.campaignCollectionMembership.findUnique({
      where: { campaignId_collectionId: { campaignId: westminsterCampaign.id, collectionId: featuredCollectionData.id } },
    });
    if (!existingMembership) {
      await prisma.campaignCollectionMembership.create({
        data: { campaignId: westminsterCampaign.id, collectionId: featuredCollectionData.id },
      });
    }
  }

  // === EVENT MEMBERSHIP ===
  const launchEventData = events.find((e) => e.slug === "fundordonate-launch");
  const launchCampaign = results.find((c) => c.slug === "fundordonate-platform-launch");
  if (launchEventData && launchCampaign) {
    const existingMembership = await prisma.campaignEventMembership.findUnique({
      where: { campaignId_eventId: { campaignId: launchCampaign.id, eventId: launchEventData.id } },
    });
    if (!existingMembership) {
      await prisma.campaignEventMembership.create({
        data: { campaignId: launchCampaign.id, eventId: launchEventData.id },
      });
    }
  }

  return results;
}

// =============================================================================
// Main Seed Function
// =============================================================================

async function main() {
  console.log("FundOrDonate — Seeding database...\n");

  const users = await seedUsers();
  console.log(`  Created ${Object.keys(users).length} users\n`);

  const categories = await seedCategories();
  console.log(`  Created ${categories.length} categories\n`);

  const tags = await seedTags();
  console.log(`  Created ${tags.length} tags\n`);

  const campaignTypes = await seedCampaignTypes();
  console.log(`  Created ${campaignTypes.length} campaign types\n`);

  const seasons = await seedSeasons();
  console.log(`  Created ${seasons.length} campaign seasons\n`);

  const groups = await seedGroups();
  console.log(`  Created ${groups.length} campaign groups\n`);

  const collections = await seedCollections();
  console.log(`  Created ${collections.length} campaign collections\n`);

  const events = await seedEvents();
  console.log(`  Created ${events.length} campaign events\n`);

  const campaigns = await seedCampaigns(users, categories, tags, campaignTypes, seasons, groups, collections, events);
  console.log(`  Created ${campaigns.length} campaigns\n`);

  console.log("Seed complete.\n");

  // Print summary
  console.log("=== SEED SUMMARY ===");
  console.log("\nUsers:");
  Object.entries(users).forEach(([key, user]) => {
    console.log(`  ${key}: ${user.email} (${user.role}/${user.userType})`);
  });
  console.log(`\nCampaigns by status:`);
  const statusCounts = campaigns.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  console.log(`\nCampaigns by mode:`);
  const modeCounts = campaigns.reduce((acc, c) => {
    acc[c.mode] = (acc[c.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(modeCounts).forEach(([mode, count]) => {
    console.log(`  ${mode}: ${count}`);
  });
  console.log(`\nCollaborator relationship: ${users.collaborator.firstName} → "Hackney Community Garden"`);
  console.log(`\nDemo login credentials: all passwords = "password123"`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
