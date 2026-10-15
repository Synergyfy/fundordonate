import {
  BusinessCampaignStatus,
  ContributionStatus,
  ContributionType,
  HubLocationType,
  MembershipTier,
  PreferredAudience,
  PrismaClient,
  TemplateApprovalMode,
  TemplateOrigin,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed with live nationwide data...");

  // 1. Seed Platform Admins
  const centralHubEmail = "admin@centralhubsolution.com";
  const centralHubPassword = "AdminPass2026!";
  const hashedChPassword = await bcrypt.hash(centralHubPassword, 10);

  const centralHubAdmin = await prisma.user.upsert({
    where: { email: centralHubEmail },
    update: {
      password: hashedChPassword,
      role: "admin",
      userType: "admin",
    },
    create: {
      email: centralHubEmail,
      username: "admin_centralhub",
      password: hashedChPassword,
      firstName: "CentralHub",
      lastName: "Admin",
      role: "admin",
      userType: "admin",
    },
  });
  console.log(`Seeded admin user: ${centralHubAdmin.email}`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@fundordonate.com";
  if (adminEmail !== centralHubEmail) {
    const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedAdminPassword,
        role: "admin",
        userType: "admin",
      },
      create: {
        email: adminEmail,
        username: adminUsername,
        password: hashedAdminPassword,
        firstName: "Platform",
        lastName: "Admin",
        role: "admin",
        userType: "admin",
      },
    });
    console.log(`Seeded fallback admin user: ${admin.email}`);
  }

  // 2. Seed Nationwide Hub Locations (Cities, Local Areas, High Streets)
  const citiesData = [
    {
      name: "Manchester",
      slug: "manchester",
      status: "ACTIVATED",
      progress: 81,
      target: 25000000,
      lat: 53.4808,
      lon: -2.2426,
      mapX: 37,
      mapY: 38,
      region: "North West",
      shortDesc: "Growing city-wide Local Hub connecting Manchester High Streets to the National Hub Community.",
      areas: [
        { name: "Northern Quarter", slug: "northern-quarter", streets: ["Oldham Street", "Tib Street"] },
        { name: "Ancoats", slug: "ancoats", streets: ["Cutting Room Square"] },
      ],
    },
    {
      name: "Camden",
      slug: "camden",
      status: "ACTIVATED",
      progress: 92,
      target: 20000000,
      lat: 51.5455,
      lon: -0.1416,
      mapX: 52,
      mapY: 86,
      region: "London",
      shortDesc: "Hyper Local Fund or Donate Hub active on Camden High Street, connecting local businesses and residents.",
      areas: [
        { name: "Camden Town", slug: "camden-town", streets: ["Camden High Street", "Chalk Farm Road"] },
      ],
    },
    {
      name: "Birmingham",
      slug: "birmingham",
      status: "ACTIVATED",
      progress: 74,
      target: 22000000,
      lat: 52.4862,
      lon: -1.8904,
      mapX: 43,
      mapY: 58,
      region: "West Midlands",
      shortDesc: "Established community hub driving Business Contributor participation across the city.",
      areas: [
        { name: "Digbeth", slug: "digbeth", streets: ["Digbeth High Street", "Custard Factory"] },
      ],
    },
    {
      name: "Leeds",
      slug: "leeds",
      status: "IN_PROGRESS",
      progress: 62,
      target: 18000000,
      lat: 53.8008,
      lon: -1.5491,
      mapX: 40,
      mapY: 32,
      region: "Yorkshire",
      shortDesc: "Local Hub activation progressing across Leeds High Streets.",
      areas: [
        { name: "City Centre", slug: "leeds-city-centre", streets: ["Briggate", "Call Lane"] },
      ],
    },
    {
      name: "Bristol",
      slug: "bristol",
      status: "IN_PROGRESS",
      progress: 59,
      target: 17500000,
      lat: 51.4545,
      lon: -2.5879,
      mapX: 37,
      mapY: 77,
      region: "South West",
      shortDesc: "Growing Local Hub with active community participation.",
      areas: [
        { name: "Bishopston", slug: "bishopston", streets: ["Gloucester Road"] },
        { name: "Clifton", slug: "clifton", streets: ["Clifton Village"] },
      ],
    },
    {
      name: "Glasgow",
      slug: "glasgow",
      status: "IN_PROGRESS",
      progress: 53,
      target: 20000000,
      lat: 55.8642,
      lon: -4.2518,
      mapX: 24,
      mapY: 24,
      region: "Scotland",
      shortDesc: "Developing Scottish Local Hub presence connecting the National Hub Community.",
      areas: [
        { name: "West End", slug: "glasgow-west-end", streets: ["Byres Road"] },
      ],
    },
    {
      name: "Liverpool",
      slug: "liverpool",
      status: "IN_PROGRESS",
      progress: 57,
      target: 19000000,
      lat: 53.4084,
      lon: -2.9916,
      mapX: 35,
      mapY: 40,
      region: "North West",
      shortDesc: "Building participation with local businesses and residents.",
      areas: [
        { name: "Baltic Triangle", slug: "baltic-triangle", streets: ["Jamaica Street"] },
      ],
    },
    {
      name: "Sheffield",
      slug: "sheffield",
      status: "IN_PROGRESS",
      progress: 51,
      target: 16000000,
      lat: 53.3811,
      lon: -1.4701,
      mapX: 41,
      mapY: 38,
      region: "Yorkshire",
      shortDesc: "Local Hub building momentum across local High Streets.",
      areas: [
        { name: "Ecclesall", slug: "ecclesall", streets: ["Ecclesall Road"] },
      ],
    },
    {
      name: "Edinburgh",
      slug: "edinburgh",
      status: "PENDING",
      progress: 47,
      target: 22000000,
      lat: 55.9533,
      lon: -3.1883,
      mapX: 28,
      mapY: 18,
      region: "Scotland",
      shortDesc: "Developing Scottish capital Hub with growing interest.",
      areas: [
        { name: "Old Town", slug: "edinburgh-old-town", streets: ["Royal Mile"] },
      ],
    },
    {
      name: "Cardiff",
      slug: "cardiff",
      status: "PENDING",
      progress: 44,
      target: 15000000,
      lat: 51.4816,
      lon: -3.1791,
      mapX: 31,
      mapY: 72,
      region: "Wales",
      shortDesc: "Welsh city Hub needs business and resident participation to activate.",
      areas: [
        { name: "Cathays", slug: "cathays", streets: ["St Mary Street"] },
      ],
    },
    {
      name: "Newcastle",
      slug: "newcastle",
      status: "PENDING",
      progress: 36,
      target: 16000000,
      lat: 54.9783,
      lon: -1.6178,
      mapX: 37,
      mapY: 20,
      region: "North East",
      shortDesc: "Requires participation to develop the north-east Local Hub.",
      areas: [
        { name: "Grainger Town", slug: "grainger-town", streets: ["Grey Street"] },
      ],
    },
    {
      name: "Belfast",
      slug: "belfast",
      status: "PENDING",
      progress: 30,
      target: 15000000,
      lat: 54.5973,
      lon: -5.9301,
      mapX: 18,
      mapY: 60,
      region: "Northern Ireland",
      shortDesc: "Needs local participation to begin Hub activation.",
      areas: [
        { name: "Cathedral Quarter", slug: "cathedral-quarter", streets: ["Donegall Street"] },
      ],
    },
  ];

  const streetLocationsMap = new Map<string, string>(); // streetName -> locationId

  for (const c of citiesData) {
    const city = await prisma.hubLocation.upsert({
      where: { slug: c.slug },
      update: {
        activationStatus: c.status,
        targetAmount: BigInt(c.target),
        latitude: c.lat,
        longitude: c.lon,
        shortDescription: c.shortDesc,
        metadata: {
          activationProgress: c.progress,
          region: c.region,
          mapX: c.mapX,
          mapY: c.mapY,
        },
      },
      create: {
        name: c.name,
        slug: c.slug,
        type: HubLocationType.CITY,
        activationStatus: c.status,
        targetAmount: BigInt(c.target),
        latitude: c.lat,
        longitude: c.lon,
        shortDescription: c.shortDesc,
        heroHeadline: `Fund & Donate ${c.name}`,
        heroSupportingText: `Connect with local high street initiatives and independent businesses across ${c.name}.`,
        metadata: {
          activationProgress: c.progress,
          region: c.region,
          mapX: c.mapX,
          mapY: c.mapY,
        },
      },
    });

    for (const a of c.areas) {
      const area = await prisma.hubLocation.upsert({
        where: { slug: a.slug },
        update: { parentId: city.id },
        create: {
          name: a.name,
          slug: a.slug,
          type: HubLocationType.LOCAL_AREA,
          parentId: city.id,
          shortDescription: `${a.name} Local Area in ${c.name}`,
        },
      });

      for (const st of a.streets) {
        const streetSlug = `${a.slug}-${st.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const street = await prisma.hubLocation.upsert({
          where: { slug: streetSlug },
          update: { parentId: area.id },
          create: {
            name: st,
            slug: streetSlug,
            type: HubLocationType.HIGH_STREET,
            parentId: area.id,
            shortDescription: `${st} High Street, ${a.name}`,
          },
        });
        streetLocationsMap.set(st, street.id);
      }
    }
  }
  console.log(`Seeded ${citiesData.length} UK Cities with complete hierarchy.`);

  // 3. Reward definitions retired — campaign rewards are now authored on the
  //    CampaignTemplate and issued into RewardIssuance (MCOM Rewards / local).

  // 3.5. Seed Seasons
  await prisma.season.upsert({
    where: { id: "winter-2026" },
    update: {
      name: "Winter 2026 Season",
      status: "ACTIVE",
    },
    create: {
      id: "winter-2026",
      referenceCode: "WINTER-2026",
      name: "Winter 2026 Season",
      status: "ACTIVE",
      startDate: new Date("2026-10-01T00:00:00Z"),
      endDate: new Date("2026-12-31T23:59:59Z"),
      durationDays: 92,
      overallTarget: BigInt(152000000),
    },
  });

  await prisma.season.upsert({
    where: { id: "autumn-2026" },
    update: {
      name: "Autumn 2026 Season",
      status: "COMPLETED",
    },
    create: {
      id: "autumn-2026",
      referenceCode: "AUTUMN-2026",
      name: "Autumn 2026 Season",
      status: "COMPLETED",
      startDate: new Date("2026-07-01T00:00:00Z"),
      endDate: new Date("2026-09-30T23:59:59Z"),
      durationDays: 92,
      overallTarget: BigInt(120000000),
    },
  });
  console.log("Seeded Seasons: Winter 2026 & Autumn 2026.");

  // 4. Seed Campaign Master Templates
  const template1 = await prisma.campaignTemplate.upsert({
    where: { slug: "winter-high-street-funding-campaign" },
    update: {
      minEligibilityTier: MembershipTier.GOLD,
      seasonId: "winter-2026",
    },
    create: {
      name: "Winter High Street Funding Campaign",
      slug: "winter-high-street-funding-campaign",
      tagline: "Unite local traders to drive footfall and support local community initiatives.",
      seasonId: "winter-2026",
      origin: TemplateOrigin.DIRECT,
      approvalMode: TemplateApprovalMode.ADMIN_REVIEW,
      minEligibilityTier: MembershipTier.GOLD,
      minContributionRequired: true,
      minContributionAmount: 10000,
      selfFundingEnabled: true,
      selfFundingMode: "optional",
      selfFundingAmount: 10000,
      selfFundingRewardName: "E-Gift Card Pack",
      fieldsConfig: [
        {
          id: "community_goal",
          label: "Community Funding Goal",
          question: "What is your main funding objective for your local community?",
          value: "Provide warm meals and support during winter",
          source: "business_input",
          locked: false,
          editable: true,
          required: true,
        },
      ],
      rewardsConfig: [
        {
          id: "rw-1",
          name: "10% High Street Discount Card",
          description: "Unlocked for backers contributing £25 or more",
          rule: "Unlocked for backers contributing £25 or more",
          category: "Discount",
          rewardCategory: "voucher",
          source: "fundordonate",
          mcomRewardId: null,
          valueGbp: null,
          audience: "both",
          delivery: "voucher_code",
          qualificationMode: "highest",
          quantityType: "unlimited",
          quantityLimit: null,
          conditions: [
            { id: "cond-rw-1", mode: "minimum", minPence: 2500, maxPence: null, exactPence: null },
          ],
        },
      ],
      mcomAssetsConfig: [],
    },
  });

  const template2 = await prisma.campaignTemplate.upsert({
    where: { slug: "youth-bakery-training-initiative" },
    update: {
      minEligibilityTier: MembershipTier.SILVER,
      seasonId: "autumn-2026",
    },
    create: {
      name: "Youth Bakery & Culinary Training",
      slug: "youth-bakery-training-initiative",
      tagline: "Provide apprenticeships and vocational training in artisan culinary skills.",
      seasonId: "autumn-2026",
      origin: TemplateOrigin.AUDIT,
      approvalMode: TemplateApprovalMode.AUTOMATIC,
      minEligibilityTier: MembershipTier.SILVER,
      minContributionRequired: false,
      selfFundingEnabled: true,
      selfFundingMode: "optional",
      selfFundingAmount: 5000,
      selfFundingRewardName: "Certificate of Sponsorship",
      fieldsConfig: [
        {
          id: "trainee_capacity",
          label: "Number of Trainees Supported",
          value: "5",
          source: "business_input",
          locked: false,
          editable: true,
          required: true,
        },
      ],
      rewardsConfig: [],
      mcomAssetsConfig: [],
    },
  });

  const templateB2B = await prisma.campaignTemplate.upsert({
    where: { slug: "b2b-independent-retail-alliance" },
    update: {
      minEligibilityTier: MembershipTier.BRONZE,
      seasonId: "winter-2026",
    },
    create: {
      name: "Independent High Street Retail Alliance",
      slug: "b2b-independent-retail-alliance",
      tagline: "Cross-merchant cooperative logistics, marketing, and shared footfall incentives.",
      seasonId: "winter-2026",
      origin: TemplateOrigin.AUDIT,
      approvalMode: TemplateApprovalMode.AUTOMATIC,
      minEligibilityTier: MembershipTier.BRONZE,
      minContributionRequired: true,
      minContributionAmount: 20000,
      selfFundingEnabled: true,
      selfFundingMode: "required",
      selfFundingAmount: 20000,
      selfFundingRewardName: "Alliance Gold Partner Badge",
      fieldsConfig: [
        {
          id: "collaboration_scope",
          label: "Shared Logistics Scope",
          question: "How will your business participate in the local merchant alliance?",
          value: "Joint freight deliveries and high street loyalty pass",
          source: "business_input",
          locked: false,
          editable: true,
          required: true,
        },
      ],
      rewardsConfig: [],
      mcomAssetsConfig: [],
    },
  });

  // Additional Bronze templates for immediate claim by all businesses
  const templateFootfall = await prisma.campaignTemplate.upsert({
    where: { slug: "high-street-footfall-growth-initiative" },
    update: {
      minEligibilityTier: MembershipTier.BRONZE,
      seasonId: "winter-2026",
    },
    create: {
      name: "High Street Local Footfall & Promotion Drive",
      slug: "high-street-footfall-growth-initiative",
      tagline: "Attract nearby customers and high-street footfall with cooperative seasonal shopping vouchers.",
      seasonId: "winter-2026",
      origin: TemplateOrigin.DIRECT,
      approvalMode: TemplateApprovalMode.AUTOMATIC,
      minEligibilityTier: MembershipTier.BRONZE,
      minContributionRequired: false,
      selfFundingEnabled: true,
      selfFundingMode: "optional",
      selfFundingAmount: 5000,
      selfFundingRewardName: "High Street Supporter Badge",
      fieldsConfig: [
        {
          id: "footfall_target",
          label: "Campaign Target Footfall",
          question: "What is your weekly customer footfall goal?",
          value: "500 shoppers weekly",
          source: "business_input",
          locked: false,
          editable: true,
          required: true,
        },
      ],
      rewardsConfig: [
        {
          id: "rw-footfall",
          name: "High Street Welcome Voucher",
          description: "Unlocked for backers contributing £10 or more",
          rule: "Unlocked for backers contributing £10 or more",
          category: "Voucher",
          rewardCategory: "voucher",
          source: "fundordonate",
          mcomRewardId: null,
          valueGbp: null,
          audience: "both",
          delivery: "voucher_code",
          qualificationMode: "highest",
          quantityType: "unlimited",
          quantityLimit: null,
          conditions: [
            { id: "cond-rw-footfall", mode: "minimum", minPence: 1000, maxPence: null, exactPence: null },
          ],
        },
      ],
      mcomAssetsConfig: [],
    },
  });

  const templateEco = await prisma.campaignTemplate.upsert({
    where: { slug: "high-street-green-sustainability-drive" },
    update: {
      minEligibilityTier: MembershipTier.BRONZE,
      seasonId: "winter-2026",
    },
    create: {
      name: "High Street Eco & Energy Sustainability Grant",
      slug: "high-street-green-sustainability-drive",
      tagline: "Upgrade store energy efficiency, install zero-waste dispensers, and transition to eco-packaging.",
      seasonId: "winter-2026",
      origin: TemplateOrigin.DIRECT,
      approvalMode: TemplateApprovalMode.AUTOMATIC,
      minEligibilityTier: MembershipTier.BRONZE,
      minContributionRequired: false,
      selfFundingEnabled: true,
      selfFundingMode: "optional",
      selfFundingAmount: 7500,
      selfFundingRewardName: "Green High Street Partner Plaque",
      fieldsConfig: [
        {
          id: "sustainability_focus",
          label: "Green Focus Area",
          question: "Which sustainability enhancement is your store implementing?",
          value: "Zero-waste refill stations & biodegradable packaging",
          source: "business_input",
          locked: false,
          editable: true,
          required: true,
        },
      ],
      rewardsConfig: [],
      mcomAssetsConfig: [],
    },
  });

  const templateArtisan = await prisma.campaignTemplate.upsert({
    where: { slug: "local-artisan-skills-hub" },
    update: {
      minEligibilityTier: MembershipTier.SILVER,
      seasonId: "autumn-2026",
    },
    create: {
      name: "Local Artisan & Apprentice Workshop Hub",
      slug: "local-artisan-skills-hub",
      tagline: "Host weekend workshops and mentor young apprentices in specialized high-street trades.",
      seasonId: "autumn-2026",
      origin: TemplateOrigin.DIRECT,
      approvalMode: TemplateApprovalMode.AUTOMATIC,
      minEligibilityTier: MembershipTier.SILVER,
      minContributionRequired: false,
      selfFundingEnabled: true,
      selfFundingMode: "optional",
      selfFundingAmount: 10000,
      selfFundingRewardName: "Master Mentor Guild Badge",
      fieldsConfig: [
        {
          id: "workshop_type",
          label: "Workshop Focus",
          question: "What trade skill will you offer to apprentices?",
          value: "Traditional craftsmanship & digital tools",
          source: "business_input",
          locked: false,
          editable: true,
          required: true,
        },
      ],
      rewardsConfig: [],
      mcomAssetsConfig: [],
    },
  });

  console.log("Seeded Campaign Master Templates.");

  // Seeded templates are intended to be live; align the new lifecycle status
  // with the legacy isActive flag so admin lists show them as Active.
  await prisma.campaignTemplate.updateMany({
    where: { isActive: true, status: "DRAFT" },
    data: { status: "ACTIVE" },
  });

  // 5. Seed Diverse Business Owners & Businesses
  const businessSeedData = [
    {
      email: "sarah@sarahsbakery.com",
      username: "sarah_baker",
      firstName: "Sarah",
      lastName: "Jenkins",
      name: "Sarah's Bakery",
      slug: "sarahs-bakery",
      city: "Manchester",
      localArea: "Northern Quarter",
      highStreet: "Oldham Street",
      postcode: "M4 1LN",
      businessType: "Restaurant & Cafe",
      category: "Food & Drink",
      preferredAudience: PreferredAudience.CONSUMER,
      tier: MembershipTier.GOLD,
      coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Feed Manchester Holiday Meal Drive",
          description: "Providing 1,000 warm meals and care parcels for families across Manchester Northern Quarter.",
          templateId: template1.id,
          targetAmount: 7500000,
          raisedAmount: 5200000,
          backers: 89,
        },
        {
          title: "Northern Quarter Youth Bakery Apprenticeships",
          description: "Teaching young people from Manchester valuable artisan baking and hospitality skills.",
          templateId: template2.id,
          targetAmount: 5000000,
          raisedAmount: 3100000,
          backers: 45,
        },
      ],
    },
    {
      email: "trade@nqmerchants.co.uk",
      username: "nq_merchants",
      firstName: "David",
      lastName: "Morrison",
      name: "Manchester Northern Quarter Merchants Alliance",
      slug: "nq-merchants-alliance",
      city: "Manchester",
      localArea: "Northern Quarter",
      highStreet: "Oldham Street",
      postcode: "M4 1LJ",
      businessType: "Retail Trade Cooperative",
      category: "Commerce & Logistics",
      preferredAudience: PreferredAudience.BUSINESS,
      tier: MembershipTier.PLATINUM,
      coverImageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Northern Quarter B2B Logistics & Shared Footfall Alliance",
          description: "Cooperative consolidated zero-emission electric freight deliveries and joint high street merchant incentives for 45 independent Northern Quarter shops.",
          templateId: templateB2B.id,
          targetAmount: 8000000,
          raisedAmount: 5600000,
          backers: 42,
        },
      ],
    },
    {
      email: "marcus@digbethcraft.co.uk",
      username: "marcus_digbeth",
      firstName: "Marcus",
      lastName: "Vance",
      name: "Digbeth Creative Workshop Co",
      slug: "digbeth-creative-workshop",
      city: "Birmingham",
      localArea: "Digbeth",
      highStreet: "Digbeth High Street",
      postcode: "B5 6DY",
      businessType: "Creative & Artisan Studio",
      category: "Arts & Culture",
      preferredAudience: PreferredAudience.BUSINESS,
      tier: MembershipTier.PLATINUM,
      coverImageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Digbeth B2B Creative Equipment & Shared Co-Op",
          description: "Funding shared industrial laser cutters and print presses for 30 independent Birmingham artisans.",
          templateId: templateB2B.id,
          targetAmount: 6000000,
          raisedAmount: 4200000,
          backers: 52,
        },
      ],
    },
    {
      email: "elena@camdencoffee.com",
      username: "elena_camden",
      firstName: "Elena",
      lastName: "Rostova",
      name: "Camden Coffee Roasters",
      slug: "camden-coffee-roasters",
      city: "Camden",
      localArea: "Camden Town",
      highStreet: "Camden High Street",
      postcode: "NW1 7JE",
      businessType: "Speciality Cafe & Roastery",
      category: "Food & Drink",
      preferredAudience: PreferredAudience.CONSUMER,
      tier: MembershipTier.GOLD,
      coverImageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Camden High Street Community Garden & Green Space",
          description: "Transforming the vacant market lot into a public community pocket garden with free outdoor seating.",
          templateId: template1.id,
          targetAmount: 2500000,
          raisedAmount: 1875000,
          backers: 64,
        },
      ],
    },
    {
      email: "oliver@gloucesterorganics.co.uk",
      username: "oliver_bristol",
      firstName: "Oliver",
      lastName: "Thorne",
      name: "Gloucester Road Organics",
      slug: "gloucester-road-organics",
      city: "Bristol",
      localArea: "Bishopston",
      highStreet: "Gloucester Road",
      postcode: "BS7 8AA",
      businessType: "Independent Grocer",
      category: "Retail & Sustainability",
      preferredAudience: PreferredAudience.CONSUMER,
      tier: MembershipTier.SILVER,
      coverImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1472851290388-39f4d448d5d3?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Gloucester Road Zero-Waste Refill Project",
          description: "Expanding zero-waste bulk refill dispensers for pantry staples to reduce single-use plastic across Bristol.",
          templateId: template1.id,
          targetAmount: 3000000,
          raisedAmount: 2250000,
          backers: 78,
        },
      ],
    },
    {
      email: "claire@leedstradeguild.com",
      username: "claire_leeds",
      firstName: "Claire",
      lastName: "Davenport",
      name: "Briggate Independent Trade Guild",
      slug: "briggate-trade-guild",
      city: "Leeds",
      localArea: "City Centre",
      highStreet: "Briggate",
      postcode: "LS1 6LX",
      businessType: "Merchant Cooperative",
      category: "Retail & Commerce",
      preferredAudience: PreferredAudience.BUSINESS,
      tier: MembershipTier.PLATINUM,
      coverImageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Northern Independent Retail Network Logistics",
          description: "Joint electric delivery cargo van pool serving 40 high street boutiques in Leeds city centre.",
          templateId: templateB2B.id,
          targetAmount: 4500000,
          raisedAmount: 2850000,
          backers: 39,
        },
      ],
    },
    {
      email: "fiona@clydebooks.scot",
      username: "fiona_glasgow",
      firstName: "Fiona",
      lastName: "MacLeod",
      name: "Clyde Artisan Books & Press",
      slug: "clyde-artisan-books",
      city: "Glasgow",
      localArea: "West End",
      highStreet: "Byres Road",
      postcode: "G12 8TT",
      businessType: "Independent Bookshop",
      category: "Arts & Culture",
      preferredAudience: PreferredAudience.CONSUMER,
      tier: MembershipTier.SILVER,
      coverImageUrl: "https://images.unsplash.com/photo-1507842229451-79b1be886a20?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Glasgow West End Community Literacy Hub",
          description: "Hosting free children's weekend reading hours and providing book grants to local primary schools.",
          templateId: template1.id,
          targetAmount: 2000000,
          raisedAmount: 1450000,
          backers: 56,
        },
      ],
    },
    {
      email: "ian@royalmileheritage.scot",
      username: "ian_edinburgh",
      firstName: "Ian",
      lastName: "Fraser",
      name: "Royal Mile Heritage Crafts",
      slug: "royal-mile-heritage-crafts",
      city: "Edinburgh",
      localArea: "Old Town",
      highStreet: "Royal Mile",
      postcode: "EH1 2PB",
      businessType: "Traditional Craft & Textiles",
      category: "Heritage & Retail",
      preferredAudience: PreferredAudience.CONSUMER,
      tier: MembershipTier.GOLD,
      coverImageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Historic Old Town High Street Greening & Floral Displays",
          description: "Installing sustainable Scottish heritage floral planters along the Royal Mile to enhance civic beauty.",
          templateId: template1.id,
          targetAmount: 3500000,
          raisedAmount: 2100000,
          backers: 81,
        },
      ],
    },
    {
      email: "guild@royalmiletraders.scot",
      username: "royal_mile_guild",
      firstName: "Angus",
      lastName: "Campbell",
      name: "Edinburgh Old Town Merchants Guild",
      slug: "edinburgh-old-town-guild",
      city: "Edinburgh",
      localArea: "Old Town",
      highStreet: "Royal Mile",
      postcode: "EH1 1RE",
      businessType: "Commercial Trade Union",
      category: "Trade & Commerce",
      preferredAudience: PreferredAudience.BUSINESS,
      tier: MembershipTier.PLATINUM,
      coverImageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Royal Mile B2B Footfall Analytics & Security Network",
          description: "Shared smart footfall sensors and coordinated merchant loss prevention network for 35 independent shops on the Royal Mile.",
          templateId: templateB2B.id,
          targetAmount: 5500000,
          raisedAmount: 3900000,
          backers: 36,
        },
      ],
    },
    {
      email: "liam@balticworkshop.co.uk",
      username: "liam_liverpool",
      firstName: "Liam",
      lastName: "Gallagher",
      name: "Baltic Creative Collaborative",
      slug: "baltic-creative-collaborative",
      city: "Liverpool",
      localArea: "Baltic Triangle",
      highStreet: "Jamaica Street",
      postcode: "L1 0AF",
      businessType: "Digital Fabrication Studio",
      category: "Creative Technology",
      preferredAudience: PreferredAudience.BUSINESS,
      tier: MembershipTier.PLATINUM,
      coverImageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=160&h=160&fit=crop",
      campaigns: [
        {
          title: "Baltic Triangle High-Speed Local Fibre & Mesh Co-Op",
          description: "Installing shared high-bandwidth community broadband for 25 start-ups on Jamaica Street.",
          templateId: templateB2B.id,
          targetAmount: 5000000,
          raisedAmount: 3800000,
          backers: 31,
        },
      ],
    },
  ];

  const genericHashedPassword = await bcrypt.hash("Password123!", 10);

  for (const bData of businessSeedData) {
    const owner = await prisma.user.upsert({
      where: { email: bData.email },
      update: {},
      create: {
        email: bData.email,
        username: bData.username,
        password: genericHashedPassword,
        firstName: bData.firstName,
        lastName: bData.lastName,
        role: "fundraiser",
        userType: "business",
        membershipTier: bData.tier,
      },
    });

    const locationId = streetLocationsMap.get(bData.highStreet);

    const business = await prisma.business.upsert({
      where: { slug: bData.slug },
      update: {
        locationId,
        preferredAudience: bData.preferredAudience,
        coverImageUrl: bData.coverImageUrl,
        logoUrl: bData.logoUrl,
        membershipTier: bData.tier,
        auditReference: `AUD-${bData.slug.toUpperCase().slice(0, 10)}-2026`,
        preAuditAnswers: {
          community_goal: `Support high street development and growth in ${bData.city}`,
          trainee_capacity: "8",
          business_name: bData.name,
          city: bData.city,
          high_street: bData.highStreet,
          category: bData.category,
        },
      },
      create: {
        ownerId: owner.id,
        name: bData.name,
        slug: bData.slug,
        businessType: bData.businessType,
        category: bData.category,
        subcategories: [bData.category],
        description: `Independent local merchant on ${bData.highStreet}, ${bData.city}.`,
        email: bData.email,
        city: bData.city,
        localArea: bData.localArea,
        highStreet: bData.highStreet,
        postcode: bData.postcode,
        membershipTier: bData.tier,
        status: "ACTIVE",
        preferredAudience: bData.preferredAudience,
        locationId,
        coverImageUrl: bData.coverImageUrl,
        logoUrl: bData.logoUrl,
        auditReference: `AUD-${bData.slug.toUpperCase().slice(0, 10)}-2026`,
        preAuditAnswers: {
          community_goal: `Support high street development and growth in ${bData.city}`,
          trainee_capacity: "8",
          business_name: bData.name,
          city: bData.city,
          high_street: bData.highStreet,
          category: bData.category,
        },
        settings: {
          create: {
            emailAlerts: true,
            campaignUpdates: true,
            leaderboardChanges: true,
            rewardsEarned: true,
            weeklyDigest: true,
          },
        },
      },
    });

    for (const cData of bData.campaigns) {
      const existingCampaign = await prisma.businessCampaign.findFirst({
        where: { businessId: business.id, title: cData.title },
      });

      if (!existingCampaign) {
        const camp = await prisma.businessCampaign.create({
          data: {
            businessId: business.id,
            templateId: cData.templateId,
            title: cData.title,
            description: cData.description,
            status: BusinessCampaignStatus.ACTIVE,
            targetAmount: cData.targetAmount,
            raisedAmount: cData.raisedAmount,
            backerCount: cData.backers,
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        });

        // Seed sample contribution to back the campaign
        await prisma.contribution.create({
          data: {
            businessId: business.id,
            campaignId: camp.id,
            type: ContributionType.ONLINE,
            status: ContributionStatus.COMPLETED,
            amount: 50000,
            reference: `WEB-${Math.floor(10000 + Math.random() * 90000)}`,
            gateway: "stripe",
          },
        });
      }
    }
  }

  // Ensure ALL businesses in the database have auditReference and preAuditAnswers so templates are immediately available to claim
  await prisma.business.updateMany({
    where: { auditReference: null },
    data: {
      auditReference: "AUD-VERIFIED-2026",
      preAuditAnswers: {
        community_goal: "High Street Footfall and Local Commerce Expansion",
        trainee_capacity: "5",
      },
    },
  });

  console.log(`Seeded ${businessSeedData.length} Live Businesses and active campaigns across the UK.`);

  console.log("Database seed completed successfully with rich live data! 🚀");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
