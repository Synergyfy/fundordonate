// =============================================================================
// High Street Demo Data
// Unified data source for all high street information across the platform.
// Admin can control this data. This is PRESENTATION / TEST data.
// =============================================================================

export interface HighStreetData {
  name: string;
  slug: string;
  activationPct: number;
  status: "active" | "making_progress" | "needs_activation" | "coming_soon";
  totalBusinesses: number;
  participatingBusinesses: number;
  campaigns: number;
  fundingRaised: number;
  fundingTarget: number;
  communityActivities: number;
  description: string;
  rewards: string[];
}

export interface LocalAreaData {
  name: string;
  slug: string;
  activationPct: number;
  status: "active" | "making_progress" | "needs_activation" | "coming_soon";
  businesses: number;
  highStreets: number;
  campaigns: number;
  fundingRaised: number;
  fundingTarget: number;
  description: string;
  highStreetsList: HighStreetData[];
}

export interface CityHighStreetData {
  citySlug: string;
  cityName: string;
  localAreas: LocalAreaData[];
}

// ───────────────────── Manchester ─────────────────────

const MANCHESTER: CityHighStreetData = {
  citySlug: "manchester",
  cityName: "Manchester",
  localAreas: [
    {
      name: "Northern Quarter",
      slug: "northern-quarter",
      activationPct: 85,
      status: "active",
      businesses: 42,
      highStreets: 3,
      campaigns: 8,
      fundingRaised: 42500,
      fundingTarget: 50000,
      description: "Creative hub with independent shops, cafes, and cultural venues.",
      highStreetsList: [
        {
          name: "Oldham Street",
          slug: "oldham-street",
          activationPct: 88,
          status: "active",
          totalBusinesses: 18,
          participatingBusinesses: 16,
          campaigns: 4,
          fundingRaised: 18500,
          fundingTarget: 20000,
          communityActivities: 6,
          description: "Heart of the Northern Quarter with independent retailers and cafes.",
          rewards: ["Featured listing", "Priority campaign placement", "Community spotlight"],
        },
        {
          name: "Tib Street",
          slug: "tib-street",
          activationPct: 82,
          status: "active",
          totalBusinesses: 14,
          participatingBusinesses: 11,
          campaigns: 3,
          fundingRaised: 14200,
          fundingTarget: 18000,
          communityActivities: 4,
          description: "Historic street with mix of traditional and modern businesses.",
          rewards: ["Local hero badge", "Seasonal rewards"],
        },
        {
          name: "Stevenson Square",
          slug: "stevenson-square",
          activationPct: 78,
          status: "active",
          totalBusinesses: 10,
          participatingBusinesses: 8,
          campaigns: 1,
          fundingRaised: 9800,
          fundingTarget: 12000,
          communityActivities: 3,
          description: "Square surrounded by trendy bars, restaurants, and creative spaces.",
          rewards: ["Founding member recognition"],
        },
      ],
    },
    {
      name: "Ancoats",
      slug: "ancoats",
      activationPct: 78,
      status: "active",
      businesses: 35,
      highStreets: 2,
      campaigns: 6,
      fundingRaised: 39000,
      fundingTarget: 50000,
      description: "Former industrial area turned trendy neighbourhood with artisan food scene.",
      highStreetsList: [
        {
          name: "Ancoats Primary Care",
          slug: "ancoats-primary-care",
          activationPct: 82,
          status: "active",
          totalBusinesses: 12,
          participatingBusinesses: 10,
          campaigns: 3,
          fundingRaised: 12800,
          fundingTarget: 15000,
          communityActivities: 5,
          description: "Medical centre and surrounding shops serving the local community.",
          rewards: ["Community champion badge", "Health partner recognition"],
        },
        {
          name: "Cutting Room Square",
          slug: "cutting-room-square",
          activationPct: 74,
          status: "active",
          totalBusinesses: 23,
          participatingBusinesses: 17,
          campaigns: 3,
          fundingRaised: 26200,
          fundingTarget: 35000,
          communityActivities: 4,
          description: "Vibrant square with restaurants, bars, and creative businesses.",
          rewards: ["Night economy champion", "Food & drink spotlight"],
        },
      ],
    },
    {
      name: "Castlefield",
      slug: "castlefield",
      activationPct: 65,
      status: "making_progress",
      businesses: 28,
      highStreets: 2,
      campaigns: 4,
      fundingRaised: 26000,
      fundingTarget: 40000,
      description: "Historic canal-side area with warehouses, restaurants, and cultural venues.",
      highStreetsList: [
        {
          name: "Deansgate",
          slug: "deansgate",
          activationPct: 70,
          status: "making_progress",
          totalBusinesses: 18,
          participatingBusinesses: 12,
          campaigns: 3,
          fundingRaised: 16800,
          fundingTarget: 22000,
          communityActivities: 3,
          description: "Major road with shops, restaurants, and historic buildings.",
          rewards: ["Heritage business recognition"],
        },
        {
          name: "Castle Street",
          slug: "castle-street",
          activationPct: 58,
          status: "making_progress",
          totalBusinesses: 10,
          participatingBusinesses: 6,
          campaigns: 1,
          fundingRaised: 9200,
          fundingTarget: 18000,
          communityActivities: 2,
          description: "Canal-side street with warehouses converted to bars and restaurants.",
          rewards: ["Canal-side business badge"],
        },
      ],
    },
    {
      name: "Didsbury",
      slug: "didsbury",
      activationPct: 72,
      status: "active",
      businesses: 38,
      highStreets: 2,
      campaigns: 5,
      fundingRaised: 36000,
      fundingTarget: 45000,
      description: "Leafy suburb with independent shops, cafes, and family-friendly atmosphere.",
      highStreetsList: [
        {
          name: "Wilmslow Road",
          slug: "wilmslow-road",
          activationPct: 78,
          status: "active",
          totalBusinesses: 22,
          participatingBusinesses: 17,
          campaigns: 3,
          fundingRaised: 22000,
          fundingTarget: 26000,
          communityActivities: 4,
          description: "Main road with restaurants, shops, and community services.",
          rewards: ["Suburban champion", "Family-friendly business"],
        },
        {
          name: "Barlow Moor Road",
          slug: "barlow-moor-road",
          activationPct: 64,
          status: "making_progress",
          totalBusinesses: 16,
          participatingBusinesses: 10,
          campaigns: 2,
          fundingRaised: 14000,
          fundingTarget: 19000,
          communityActivities: 3,
          description: "Local high street with everyday services and independent shops.",
          rewards: ["Local services recognition"],
        },
      ],
    },
    {
      name: "Levenshulme",
      slug: "levenshulme",
      activationPct: 55,
      status: "making_progress",
      businesses: 25,
      highStreets: 1,
      campaigns: 3,
      fundingRaised: 16500,
      fundingTarget: 30000,
      description: "Diverse neighbourhood with vibrant market and multicultural food scene.",
      highStreetsList: [
        {
          name: "Levenshulme Market Street",
          slug: "levenshulme-market-street",
          activationPct: 55,
          status: "making_progress",
          totalBusinesses: 25,
          participatingBusinesses: 14,
          campaigns: 3,
          fundingRaised: 16500,
          fundingTarget: 30000,
          communityActivities: 5,
          description: "Market street with diverse businesses and community markets.",
          rewards: ["Market champion", "Cultural diversity award"],
        },
      ],
    },
    {
      name: "Chorlton",
      slug: "chorlton",
      activationPct: 48,
      status: "making_progress",
      businesses: 30,
      highStreets: 2,
      campaigns: 4,
      fundingRaised: 14400,
      fundingTarget: 30000,
      description: "Bohemian suburb known for independent shops, bars, and green spaces.",
      highStreetsList: [
        {
          name: "Barlow Moor Road",
          slug: "chorlton-barlow-moor",
          activationPct: 52,
          status: "making_progress",
          totalBusinesses: 18,
          participatingBusinesses: 9,
          campaigns: 2,
          fundingRaised: 9200,
          fundingTarget: 18000,
          communityActivities: 3,
          description: "Main commercial strip with independent retailers and eateries.",
          rewards: ["Independent business badge"],
        },
        {
          name: "Manchester Road",
          slug: "chorlton-manchester-road",
          activationPct: 42,
          status: "needs_activation",
          totalBusinesses: 12,
          participatingBusinesses: 5,
          campaigns: 2,
          fundingRaised: 5200,
          fundingTarget: 12000,
          communityActivities: 2,
          description: "Connecting road with local shops and services.",
          rewards: ["Early adopter recognition"],
        },
      ],
    },
  ],
};

// ───────────────────── Winchester ─────────────────────

const WINCHESTER: CityHighStreetData = {
  citySlug: "winchester",
  cityName: "Winchester",
  localAreas: [
    {
      name: "Winchester Central",
      slug: "winchester-central",
      activationPct: 75,
      status: "active",
      businesses: 45,
      highStreets: 2,
      campaigns: 7,
      fundingRaised: 37500,
      fundingTarget: 50000,
      description: "Historic city centre with cathedral, high street shops, and cultural attractions.",
      highStreetsList: [
        {
          name: "High Street",
          slug: "high-street",
          activationPct: 80,
          status: "active",
          totalBusinesses: 25,
          participatingBusinesses: 20,
          campaigns: 4,
          fundingRaised: 21000,
          fundingTarget: 25000,
          communityActivities: 5,
          description: "Main high street with premium shops, restaurants, and historic buildings.",
          rewards: ["Heritage business badge", "City centre champion"],
        },
        {
          name: "Brooks Shopping Centre",
          slug: "brooks-shopping-centre",
          activationPct: 68,
          status: "making_progress",
          totalBusinesses: 20,
          participatingBusinesses: 14,
          campaigns: 3,
          fundingRaised: 16500,
          fundingTarget: 25000,
          communityActivities: 3,
          description: "Covered shopping centre with major retailers and food outlets.",
          rewards: ["Retail partner recognition"],
        },
      ],
    },
    {
      name: "Winchester West",
      slug: "winchester-west",
      activationPct: 62,
      status: "making_progress",
      businesses: 30,
      highStreets: 2,
      campaigns: 4,
      fundingRaised: 18600,
      fundingTarget: 30000,
      description: "Residential area with local shops, schools, and community facilities.",
      highStreetsList: [
        {
          name: "Stockbridge Road",
          slug: "stockbridge-road",
          activationPct: 65,
          status: "making_progress",
          totalBusinesses: 18,
          participatingBusinesses: 12,
          campaigns: 2,
          fundingRaised: 11700,
          fundingTarget: 18000,
          communityActivities: 3,
          description: "Local road with everyday shops and services.",
          rewards: ["Community services badge"],
        },
        {
          name: "Cheriton Road",
          slug: "cheriton-road",
          activationPct: 58,
          status: "making_progress",
          totalBusinesses: 12,
          participatingBusinesses: 7,
          campaigns: 2,
          fundingRaised: 6900,
          fundingTarget: 12000,
          communityActivities: 2,
          description: "Residential high street with independent retailers.",
          rewards: ["Local loyalty recognition"],
        },
      ],
    },
    {
      name: "Winchester East",
      slug: "winchester-east",
      activationPct: 55,
      status: "making_progress",
      businesses: 25,
      highStreets: 1,
      campaigns: 3,
      fundingRaised: 11000,
      fundingTarget: 20000,
      description: "Eastern area with mix of residential and commercial properties.",
      highStreetsList: [
        {
          name: "Winnall Industrial Estate",
          slug: "winnall-industrial",
          activationPct: 55,
          status: "making_progress",
          totalBusinesses: 25,
          participatingBusinesses: 14,
          campaigns: 3,
          fundingRaised: 11000,
          fundingTarget: 20000,
          communityActivities: 2,
          description: "Industrial estate with warehouses, workshops, and commercial units.",
          rewards: ["Business park champion"],
        },
      ],
    },
    {
      name: "Winchester South",
      slug: "winchester-south",
      activationPct: 40,
      status: "needs_activation",
      businesses: 20,
      highStreets: 1,
      campaigns: 2,
      fundingRaised: 6000,
      fundingTarget: 20000,
      description: "Southern suburbs with shopping parade and local services.",
      highStreetsList: [
        {
          name: "Badger Farm Road",
          slug: "badger-farm-road",
          activationPct: 40,
          status: "needs_activation",
          totalBusinesses: 20,
          participatingBusinesses: 8,
          campaigns: 2,
          fundingRaised: 6000,
          fundingTarget: 20000,
          communityActivities: 2,
          description: "Local shopping area serving residential communities.",
          rewards: ["Early stage recognition"],
        },
      ],
    },
  ],
};

// ───────────────────── London ─────────────────────

const LONDON: CityHighStreetData = {
  citySlug: "london",
  cityName: "London",
  localAreas: [
    {
      name: "Camden",
      slug: "camden",
      activationPct: 88,
      status: "active",
      businesses: 65,
      highStreets: 3,
      campaigns: 12,
      fundingRaised: 88000,
      fundingTarget: 100000,
      description: "Vibrant borough known for markets, music venues, and eclectic shops.",
      highStreetsList: [
        {
          name: "Camden High Street",
          slug: "camden-high-street",
          activationPct: 92,
          status: "active",
          totalBusinesses: 30,
          participatingBusinesses: 28,
          campaigns: 6,
          fundingRaised: 42000,
          fundingTarget: 45000,
          communityActivities: 8,
          description: "Famous high street with markets, vintage shops, and street food.",
          rewards: ["Market champion", "Night economy leader", "Cultural hotspot"],
        },
        {
          name: "Chalk Farm Road",
          slug: "chalk-farm-road",
          activationPct: 85,
          status: "active",
          totalBusinesses: 20,
          participatingBusinesses: 17,
          campaigns: 4,
          fundingRaised: 28000,
          fundingTarget: 30000,
          communityActivities: 5,
          description: "Artistic area with galleries, studios, and creative businesses.",
          rewards: ["Creative quarter badge", "Art lover recognition"],
        },
        {
          name: "Hawley Crescent",
          slug: "hawley-crescent",
          activationPct: 80,
          status: "active",
          totalBusinesses: 15,
          participatingBusinesses: 12,
          campaigns: 2,
          fundingRaised: 18000,
          fundingTarget: 25000,
          communityActivities: 4,
          description: "Canal-side crescent with bars, restaurants, and entertainment.",
          rewards: ["Canal-side champion"],
        },
      ],
    },
    {
      name: "Westminster",
      slug: "westminster",
      activationPct: 90,
      status: "active",
      businesses: 80,
      highStreets: 3,
      campaigns: 15,
      fundingRaised: 135000,
      fundingTarget: 150000,
      description: "Heart of London with Parliament, West End theatres, and premium retail.",
      highStreetsList: [
        {
          name: "Oxford Street",
          slug: "oxford-street",
          activationPct: 95,
          status: "active",
          totalBusinesses: 35,
          participatingBusinesses: 33,
          campaigns: 7,
          fundingRaised: 52000,
          fundingTarget: 55000,
          communityActivities: 10,
          description: "World-famous shopping street with flagship stores.",
          rewards: ["Retail flagship recognition", "West End champion"],
        },
        {
          name: "Regent Street",
          slug: "regent-street",
          activationPct: 88,
          status: "active",
          totalBusinesses: 25,
          participatingBusinesses: 22,
          campaigns: 5,
          fundingRaised: 45000,
          fundingTarget: 50000,
          communityActivities: 6,
          description: "Premium shopping destination with heritage architecture.",
          rewards: ["Heritage retail badge"],
        },
        {
          name: "Covent Garden",
          slug: "covent-garden",
          activationPct: 85,
          status: "active",
          totalBusinesses: 20,
          participatingBusinesses: 17,
          campaigns: 3,
          fundingRaised: 38000,
          fundingTarget: 45000,
          communityActivities: 5,
          description: "Piazza with street performers, boutique shops, and restaurants.",
          rewards: ["Cultural quarter recognition"],
        },
      ],
    },
    {
      name: "Islington",
      slug: "islington",
      activationPct: 82,
      status: "active",
      businesses: 55,
      highStreets: 2,
      campaigns: 10,
      fundingRaised: 66000,
      fundingTarget: 80000,
      description: "Trendy borough with independent shops, restaurants, and canal walks.",
      highStreetsList: [
        {
          name: "Upper Street",
          slug: "upper-street",
          activationPct: 88,
          status: "active",
          totalBusinesses: 30,
          participatingBusinesses: 26,
          campaigns: 6,
          fundingRaised: 39000,
          fundingTarget: 42000,
          communityActivities: 7,
          description: "Main high street with theatres, restaurants, and independent shops.",
          rewards: ["Theatreland champion", "Dining destination"],
        },
        {
          name: "Camden Passage",
          slug: "camden-passage",
          activationPct: 75,
          status: "active",
          totalBusinesses: 25,
          participatingBusinesses: 19,
          campaigns: 4,
          fundingRaised: 27000,
          fundingTarget: 38000,
          communityActivities: 4,
          description: "Historic passage with antique shops and weekend markets.",
          rewards: ["Antique quarter badge"],
        },
      ],
    },
  ],
};

// ───────────────────── Birmingham ─────────────────────

const BIRMINGHAM: CityHighStreetData = {
  citySlug: "birmingham",
  cityName: "Birmingham",
  localAreas: [
    {
      name: "Birmingham City Centre",
      slug: "birmingham-city-centre",
      activationPct: 70,
      status: "active",
      businesses: 60,
      highStreets: 3,
      campaigns: 9,
      fundingRaised: 52500,
      fundingTarget: 75000,
      description: "UK's second city with major retail, business, and cultural quarter.",
      highStreetsList: [
        {
          name: "New Street",
          slug: "new-street",
          activationPct: 78,
          status: "active",
          totalBusinesses: 28,
          participatingBusinesses: 22,
          campaigns: 5,
          fundingRaised: 22000,
          fundingTarget: 28000,
          communityActivities: 6,
          description: "Main shopping street with Grand Central and Bullring access.",
          rewards: ["City centre champion"],
        },
        {
          name: "Digbeth High Street",
          slug: "digbeth-high-street",
          activationPct: 65,
          status: "making_progress",
          totalBusinesses: 18,
          participatingBusinesses: 12,
          campaigns: 3,
          fundingRaised: 16500,
          fundingTarget: 25000,
          communityActivities: 4,
          description: "Creative quarter with street art, markets, and independent businesses.",
          rewards: ["Creative quarter badge", "Street art champion"],
        },
        {
          name: "Jewellery Quarter",
          slug: "jewellery-quarter",
          activationPct: 62,
          status: "making_progress",
          totalBusinesses: 14,
          participatingBusinesses: 9,
          campaigns: 1,
          fundingRaised: 14000,
          fundingTarget: 22000,
          communityActivities: 3,
          description: "Historic jewellery district with workshops and showrooms.",
          rewards: ["Heritage craft recognition"],
        },
      ],
    },
    {
      name: "Moseley",
      slug: "moseley",
      activationPct: 58,
      status: "making_progress",
      businesses: 30,
      highStreets: 1,
      campaigns: 4,
      fundingRaised: 17400,
      fundingTarget: 30000,
      description: "Bohemian village with independent shops, pubs, and weekend farmers market.",
      highStreetsList: [
        {
          name: "Alcester Road",
          slug: "alcester-road",
          activationPct: 58,
          status: "making_progress",
          totalBusinesses: 30,
          participatingBusinesses: 17,
          campaigns: 4,
          fundingRaised: 17400,
          fundingTarget: 30000,
          communityActivities: 5,
          description: "Village high street with independent retailers and community hub.",
          rewards: ["Village champion", "Market supporter"],
        },
      ],
    },
    {
      name: "Kings Heath",
      slug: "kings-heath",
      activationPct: 45,
      status: "needs_activation",
      businesses: 25,
      highStreets: 1,
      campaigns: 3,
      fundingRaised: 9000,
      fundingTarget: 25000,
      description: "Suburban high street with local shops, cafes, and community spaces.",
      highStreetsList: [
        {
          name: "High Street Kings Heath",
          slug: "high-street-kings-heath",
          activationPct: 45,
          status: "needs_activation",
          totalBusinesses: 25,
          participatingBusinesses: 11,
          campaigns: 3,
          fundingRaised: 9000,
          fundingTarget: 25000,
          communityActivities: 3,
          description: "Local high street serving residential communities.",
          rewards: ["Community builder badge"],
        },
      ],
    },
  ],
};

// ───────────────────── Leeds ─────────────────────

const LEEDS: CityHighStreetData = {
  citySlug: "leeds",
  cityName: "Leeds",
  localAreas: [
    {
      name: "Leeds City Centre",
      slug: "leeds-city-centre",
      activationPct: 55,
      status: "making_progress",
      businesses: 50,
      highStreets: 2,
      campaigns: 7,
      fundingRaised: 27500,
      fundingTarget: 50000,
      description: "Vibrant city centre with shopping, dining, and cultural attractions.",
      highStreetsList: [
        {
          name: "Briggate",
          slug: "briggate",
          activationPct: 62,
          status: "making_progress",
          totalBusinesses: 25,
          participatingBusinesses: 15,
          campaigns: 4,
          fundingRaised: 15000,
          fundingTarget: 25000,
          communityActivities: 4,
          description: "Main shopping street with high street brands and department stores.",
          rewards: ["Retail champion"],
        },
        {
          name: "Corn Exchange",
          slug: "corn-exchange",
          activationPct: 48,
          status: "needs_activation",
          totalBusinesses: 25,
          participatingBusinesses: 12,
          campaigns: 3,
          fundingRaised: 12500,
          fundingTarget: 25000,
          communityActivities: 3,
          description: "Historic exchange building with independent retailers and food hall.",
          rewards: ["Heritage building recognition"],
        },
      ],
    },
    {
      name: "Headingley",
      slug: "headingley",
      activationPct: 42,
      status: "needs_activation",
      businesses: 30,
      highStreets: 1,
      campaigns: 3,
      fundingRaised: 8400,
      fundingTarget: 25000,
      description: "Student and family area with pubs, shops, and Otley Run pub crawl route.",
      highStreetsList: [
        {
          name: "Otley Road",
          slug: "otley-road",
          activationPct: 42,
          status: "needs_activation",
          totalBusinesses: 30,
          participatingBusinesses: 12,
          campaigns: 3,
          fundingRaised: 8400,
          fundingTarget: 25000,
          communityActivities: 3,
          description: "Main road with pubs, takeaways, and student-friendly shops.",
          rewards: ["Student community champion"],
        },
      ],
    },
  ],
};

// ───────────────────── Liverpool ─────────────────────

const LIVERPOOL: CityHighStreetData = {
  citySlug: "liverpool",
  cityName: "Liverpool",
  localAreas: [
    {
      name: "Liverpool City Centre",
      slug: "liverpool-city-centre",
      activationPct: 50,
      status: "making_progress",
      businesses: 45,
      highStreets: 2,
      campaigns: 6,
      fundingRaised: 22500,
      fundingTarget: 45000,
      description: "Waterfront city with rich musical heritage, shopping, and cultural scene.",
      highStreetsList: [
        {
          name: "Church Street",
          slug: "church-street",
          activationPct: 58,
          status: "making_progress",
          totalBusinesses: 22,
          participatingBusinesses: 13,
          campaigns: 3,
          fundingRaised: 12000,
          fundingTarget: 22000,
          communityActivities: 4,
          description: "Pedestrianised shopping street with major retailers.",
          rewards: ["Retail champion"],
        },
        {
          name: "Albert Dock",
          slug: "albert-dock",
          activationPct: 42,
          status: "needs_activation",
          totalBusinesses: 23,
          participatingBusinesses: 10,
          campaigns: 3,
          fundingRaised: 10500,
          fundingTarget: 23000,
          communityActivities: 3,
          description: "UNESCO World Heritage waterfront with museums, galleries, and restaurants.",
          rewards: ["Waterfront heritage badge"],
        },
      ],
    },
    {
      name: "Bold Street",
      slug: "bold-street",
      activationPct: 62,
      status: "making_progress",
      businesses: 25,
      highStreets: 1,
      campaigns: 4,
      fundingRaised: 15500,
      fundingTarget: 25000,
      description: "Independent shopping street with cafes, record shops, and vintage stores.",
      highStreetsList: [
        {
          name: "Bold Street",
          slug: "bold-street-liverpool",
          activationPct: 62,
          status: "making_progress",
          totalBusinesses: 25,
          participatingBusinesses: 15,
          campaigns: 4,
          fundingRaised: 15500,
          fundingTarget: 25000,
          communityActivities: 5,
          description: "Independent high street with character and community spirit.",
          rewards: ["Independent champion", "Music city recognition"],
        },
      ],
    },
  ],
};

// ───────────────────── Bristol ─────────────────────

const BRISTOL: CityHighStreetData = {
  citySlug: "bristol",
  cityName: "Bristol",
  localAreas: [
    {
      name: "Bristol City Centre",
      slug: "bristol-city-centre",
      activationPct: 48,
      status: "needs_activation",
      businesses: 40,
      highStreets: 2,
      campaigns: 5,
      fundingRaised: 19200,
      fundingTarget: 40000,
      description: "Creative city with street art, music scene, and vibrant harbour.",
      highStreetsList: [
        {
          name: "Broadmead",
          slug: "broadmead",
          activationPct: 52,
          status: "making_progress",
          totalBusinesses: 20,
          participatingBusinesses: 10,
          campaigns: 3,
          fundingRaised: 10000,
          fundingTarget: 20000,
          communityActivities: 3,
          description: "Main shopping area with planned regeneration.",
          rewards: ["Regeneration champion"],
        },
        {
          name: "Gloucester Road",
          slug: "gloucester-road",
          activationPct: 65,
          status: "making_progress",
          totalBusinesses: 20,
          participatingBusinesses: 13,
          campaigns: 2,
          fundingRaised: 13000,
          fundingTarget: 20000,
          communityActivities: 4,
          description: "Independent high street with record shops, cafes, and community feel.",
          rewards: ["Independent spirit badge"],
        },
      ],
    },
    {
      name: "Clifton",
      slug: "clifton",
      activationPct: 55,
      status: "making_progress",
      businesses: 30,
      highStreets: 1,
      campaigns: 3,
      fundingRaised: 16500,
      fundingTarget: 30000,
      description: "Affluent area with boutique shops, restaurants, and Clifton Suspension Bridge.",
      highStreetsList: [
        {
          name: "Clifton Village",
          slug: "clifton-village",
          activationPct: 55,
          status: "making_progress",
          totalBusinesses: 30,
          participatingBusinesses: 16,
          campaigns: 3,
          fundingRaised: 16500,
          fundingTarget: 30000,
          communityActivities: 3,
          description: "Village-style high street with boutique shopping and dining.",
          rewards: ["Village character recognition"],
        },
      ],
    },
  ],
};

// ───────────────────── Glasgow ─────────────────────

const GLASGOW: CityHighStreetData = {
  citySlug: "glasgow",
  cityName: "Glasgow",
  localAreas: [
    {
      name: "Glasgow City Centre",
      slug: "glasgow-city-centre",
      activationPct: 45,
      status: "needs_activation",
      businesses: 50,
      highStreets: 2,
      campaigns: 5,
      fundingRaised: 15750,
      fundingTarget: 35000,
      description: "Scotland's largest city with world-class architecture and cultural scene.",
      highStreetsList: [
        {
          name: "Buchanan Street",
          slug: "buchanan-street",
          activationPct: 55,
          status: "making_progress",
          totalBusinesses: 25,
          participatingBusinesses: 14,
          campaigns: 3,
          fundingRaised: 9000,
          fundingTarget: 16000,
          communityActivities: 4,
          description: "Premium shopping street with flagship stores and street performers.",
          rewards: ["Retail premium badge"],
        },
        {
          name: "Ashton Lane",
          slug: "ashton-lane",
          activationPct: 58,
          status: "making_progress",
          totalBusinesses: 25,
          participatingBusinesses: 15,
          campaigns: 2,
          fundingRaised: 6750,
          fundingTarget: 19000,
          communityActivities: 3,
          description: "Cobbled lane with bars, restaurants, and independent cinema.",
          rewards: ["Hidden gem recognition"],
        },
      ],
    },
  ],
};

// ───────────────────── Edinburgh ─────────────────────

const EDINBURGH: CityHighStreetData = {
  citySlug: "edinburgh",
  cityName: "Edinburgh",
  localAreas: [
    {
      name: "Edinburgh Old Town",
      slug: "edinburgh-old-town",
      activationPct: 42,
      status: "needs_activation",
      businesses: 35,
      highStreets: 2,
      campaigns: 4,
      fundingRaised: 12600,
      fundingTarget: 30000,
      description: "Historic Royal Mile with cobblestone streets and medieval buildings.",
      highStreetsList: [
        {
          name: "Royal Mile",
          slug: "royal-mile",
          activationPct: 48,
          status: "needs_activation",
          totalBusinesses: 18,
          participatingBusinesses: 9,
          campaigns: 2,
          fundingRaised: 7200,
          fundingTarget: 15000,
          communityActivities: 3,
          description: "Historic street connecting Edinburgh Castle and Holyrood Palace.",
          rewards: ["Heritage tourism badge"],
        },
        {
          name: "Grassmarket",
          slug: "grassmarket",
          activationPct: 35,
          status: "needs_activation",
          totalBusinesses: 17,
          participatingBusinesses: 6,
          campaigns: 2,
          fundingRaised: 5400,
          fundingTarget: 15000,
          communityActivities: 2,
          description: "Historic marketplace with pubs, shops, and castle views.",
          rewards: ["Historic venue recognition"],
        },
      ],
    },
  ],
};

// ───────────────────── London Boroughs ─────────────────────

const CAMDEN: CityHighStreetData = {
  citySlug: "camden",
  cityName: "Camden",
  localAreas: [
    {
      name: "Camden Town",
      slug: "camden-town",
      activationPct: 92,
      status: "active",
      businesses: 48,
      highStreets: 3,
      campaigns: 6,
      fundingRaised: 28500,
      fundingTarget: 35000,
      description: "Iconic Camden Market area with vibrant high street culture.",
      highStreetsList: [
        { name: "Camden High Street", slug: "camden-high-street", activationPct: 95, status: "active", totalBusinesses: 22, participatingBusinesses: 18, campaigns: 3, fundingRaised: 14500, fundingTarget: 18000, communityActivities: 8, description: "Main high street through Camden Town.", rewards: ["Camden Market discount card"] },
        { name: "Chalk Farm Road", slug: "chalk-farm-road", activationPct: 88, status: "active", totalBusinesses: 14, participatingBusinesses: 10, campaigns: 2, fundingRaised: 8200, fundingTarget: 10000, communityActivities: 5, description: "Arts and culture hub near the Roundhouse.", rewards: ["Roundhouse event priority"] },
        { name: "Hawley Crescent", slug: "hawley-crescent", activationPct: 85, status: "active", totalBusinesses: 12, participatingBusinesses: 9, campaigns: 1, fundingRaised: 5800, fundingTarget: 7000, communityActivities: 4, description: "Creative quarter with independent shops.", rewards: ["Independent shop loyalty pass"] },
      ],
    },
    {
      name: "Hampstead",
      slug: "hampstead",
      activationPct: 88,
      status: "active",
      businesses: 35,
      highStreets: 2,
      campaigns: 4,
      fundingRaised: 22000,
      fundingTarget: 28000,
      description: "Affluent village feel with upscale high street shopping.",
      highStreetsList: [
        { name: "Hampstead High Street", slug: "hampstead-high-street", activationPct: 92, status: "active", totalBusinesses: 18, participatingBusinesses: 14, campaigns: 2, fundingRaised: 12500, fundingTarget: 15000, communityActivities: 6, description: "Upscale shopping and dining destination.", rewards: ["Hampstead Village card"] },
        { name: "Flask Walk", slug: "flask-walk", activationPct: 82, status: "active", totalBusinesses: 17, participatingBusinesses: 12, campaigns: 2, fundingRaised: 9500, fundingTarget: 13000, communityActivities: 4, description: "Historic pedestrian alley with boutiques.", rewards: ["Historic walk badge"] },
      ],
    },
  ],
};

const ISLINGTON: CityHighStreetData = {
  citySlug: "islington",
  cityName: "Islington",
  localAreas: [
    {
      name: "Islington High Street",
      slug: "islington-high-street",
      activationPct: 88,
      status: "active",
      businesses: 42,
      highStreets: 2,
      campaigns: 5,
      fundingRaised: 26000,
      fundingTarget: 32000,
      description: "Bustling high street with diverse restaurants and shops.",
      highStreetsList: [
        { name: "Upper Street", slug: "upper-street", activationPct: 92, status: "active", totalBusinesses: 24, participatingBusinesses: 19, campaigns: 3, fundingRaised: 16000, fundingTarget: 20000, communityActivities: 7, description: "Main artery of Islington with theatres and restaurants.", rewards: ["Islington Dining card"] },
        { name: "Essex Road", slug: "essex-road", activationPct: 82, status: "active", totalBusinesses: 18, participatingBusinesses: 13, campaigns: 2, fundingRaised: 10000, fundingTarget: 12000, communityActivities: 5, description: "Eclectic mix of independent shops and cafes.", rewards: ["Essex Road loyalty pass"] },
      ],
    },
  ],
};

const SOUTHWARK: CityHighStreetData = {
  citySlug: "southwark",
  cityName: "Southwark",
  localAreas: [
    {
      name: "Southwark Town Centre",
      slug: "southwark-town-centre",
      activationPct: 85,
      status: "active",
      businesses: 38,
      highStreets: 2,
      campaigns: 4,
      fundingRaised: 24000,
      fundingTarget: 30000,
      description: "Cultural hub near Tate Modern and Shakespeare's Globe.",
      highStreetsList: [
        { name: "Southwark High Street", slug: "southwark-high-street", activationPct: 88, status: "active", totalBusinesses: 20, participatingBusinesses: 15, campaigns: 2, fundingRaised: 13000, fundingTarget: 16000, communityActivities: 6, description: "Main high street with riverfront attractions.", rewards: ["River Pass discount"] },
        { name: "Borough High Street", slug: "borough-high-street", activationPct: 80, status: "active", totalBusinesses: 18, participatingBusinesses: 13, campaigns: 2, fundingRaised: 11000, fundingTarget: 14000, communityActivities: 4, description: "Historic market area near London Bridge.", rewards: ["Borough Market card"] },
      ],
    },
  ],
};

const GREENWICH: CityHighStreetData = {
  citySlug: "greenwich",
  cityName: "Greenwich",
  localAreas: [
    {
      name: "Greenwich Town Centre",
      slug: "greenwich-town-centre",
      activationPct: 78,
      status: "active",
      businesses: 36,
      highStreets: 2,
      campaigns: 4,
      fundingRaised: 20000,
      fundingTarget: 28000,
      description: "Maritime heritage area with market and observatory.",
      highStreetsList: [
        { name: "Greenwich High Road", slug: "greenwich-high-road", activationPct: 82, status: "active", totalBusinesses: 20, participatingBusinesses: 14, campaigns: 2, fundingRaised: 11000, fundingTarget: 15000, communityActivities: 5, description: "Main thoroughfare through Greenwich town centre.", rewards: ["Greenwich Market pass"] },
        { name: "Deptford High Street", slug: "deptford-high-street", activationPct: 72, status: "active", totalBusinesses: 16, participatingBusinesses: 11, campaigns: 2, fundingRaised: 9000, fundingTarget: 13000, communityActivities: 4, description: "Creative hub with independent retailers.", rewards: ["Deptford Creative badge"] },
      ],
    },
  ],
};

const HACKNEY: CityHighStreetData = {
  citySlug: "hackney",
  cityName: "Hackney",
  localAreas: [
    {
      name: "Hackney Central",
      slug: "hackney-central",
      activationPct: 64,
      status: "making_progress",
      businesses: 30,
      highStreets: 2,
      campaigns: 3,
      fundingRaised: 15000,
      fundingTarget: 25000,
      description: "Trendy area with artisan shops and street art.",
      highStreetsList: [
        { name: "Hackney Road", slug: "hackney-road", activationPct: 68, status: "making_progress", totalBusinesses: 16, participatingBusinesses: 10, campaigns: 2, fundingRaised: 8500, fundingTarget: 13000, communityActivities: 4, description: "Hip strip with vintage shops and cafes.", rewards: ["Hackney Art Walk badge"] },
        { name: "Kingsland Road", slug: "kingsland-road", activationPct: 58, status: "making_progress", totalBusinesses: 14, participatingBusinesses: 8, campaigns: 1, fundingRaised: 6500, fundingTarget: 12000, communityActivities: 3, description: "Diverse dining and retail corridor.", rewards: ["Kingsland Dining pass"] },
      ],
    },
  ],
};

const LAMBETH: CityHighStreetData = {
  citySlug: "lambeth",
  cityName: "Lambeth",
  localAreas: [
    {
      name: "Brixton Town Centre",
      slug: "brixton-town-centre",
      activationPct: 60,
      status: "making_progress",
      businesses: 32,
      highStreets: 2,
      campaigns: 3,
      fundingRaised: 14000,
      fundingTarget: 24000,
      description: "Vibrant cultural hub with market and music venues.",
      highStreetsList: [
        { name: "Brixton High Street", slug: "brixton-high-street", activationPct: 65, status: "making_progress", totalBusinesses: 18, participatingBusinesses: 11, campaigns: 2, fundingRaised: 8000, fundingTarget: 13000, communityActivities: 5, description: "Main high street with Brixton Market.", rewards: ["Brixton Market card"] },
        { name: "Coldharbour Lane", slug: "coldharbour-lane", activationPct: 52, status: "making_progress", totalBusinesses: 14, participatingBusinesses: 8, campaigns: 1, fundingRaised: 6000, fundingTarget: 11000, communityActivities: 3, description: "Eclectic mix of Caribbean and African businesses.", rewards: ["Cultural Heritage badge"] },
      ],
    },
  ],
};

const WESTMINSTER: CityHighStreetData = {
  citySlug: "westminster",
  cityName: "Westminster",
  localAreas: [
    {
      name: "Soho & Covent Garden",
      slug: "soho-covent-garden",
      activationPct: 66,
      status: "making_progress",
      businesses: 45,
      highStreets: 3,
      campaigns: 5,
      fundingRaised: 18000,
      fundingTarget: 30000,
      description: "Entertainment and retail heart of London's West End.",
      highStreetsList: [
        { name: "Oxford Street", slug: "oxford-street", activationPct: 72, status: "making_progress", totalBusinesses: 20, participatingBusinesses: 13, campaigns: 2, fundingRaised: 8500, fundingTarget: 14000, communityActivities: 4, description: "World-famous shopping destination.", rewards: ["West End Shopping pass"] },
        { name: "Carnaby Street", slug: "carnaby-street", activationPct: 65, status: "making_progress", totalBusinesses: 12, participatingBusinesses: 8, campaigns: 2, fundingRaised: 5500, fundingTarget: 9000, communityActivities: 3, description: "Iconic fashion and lifestyle street.", rewards: ["Carnaby Style card"] },
        { name: "Covent Garden Piazza", slug: "covent-garden-piazza", activationPct: 60, status: "making_progress", totalBusinesses: 13, participatingBusinesses: 8, campaigns: 1, fundingRaised: 4000, fundingTarget: 7000, communityActivities: 4, description: "Historic market and entertainment venue.", rewards: ["Market Performer pass"] },
      ],
    },
  ],
};

const TOWER_HAMLETS: CityHighStreetData = {
  citySlug: "tower-hamlets",
  cityName: "Tower Hamlets",
  localAreas: [
    {
      name: "Whitechapel",
      slug: "whitechapel",
      activationPct: 58,
      status: "making_progress",
      businesses: 28,
      highStreets: 2,
      campaigns: 3,
      fundingRaised: 12000,
      fundingTarget: 22000,
      description: "Historic East End area with diverse community.",
      highStreetsList: [
        { name: "Whitechapel Road", slug: "whitechapel-road", activationPct: 62, status: "making_progress", totalBusinesses: 16, participatingBusinesses: 9, campaigns: 2, fundingRaised: 7000, fundingTarget: 12000, communityActivities: 4, description: "Diverse high street with traditional and modern shops.", rewards: ["East End Heritage badge"] },
        { name: "Brick Lane", slug: "brick-lane", activationPct: 52, status: "making_progress", totalBusinesses: 12, participatingBusinesses: 7, campaigns: 1, fundingRaised: 5000, fundingTarget: 10000, communityActivities: 3, description: "Famous for curry houses and vintage shops.", rewards: ["Brick Lane Food pass"] },
      ],
    },
  ],
};

const WANDSWORTH: CityHighStreetData = {
  citySlug: "wandsworth",
  cityName: "Wandsworth",
  localAreas: [
    {
      name: "Wandsworth Town Centre",
      slug: "wandsworth-town-centre",
      activationPct: 55,
      status: "making_progress",
      businesses: 26,
      highStreets: 2,
      campaigns: 2,
      fundingRaised: 11000,
      fundingTarget: 20000,
      description: "South London town centre with riverside walks.",
      highStreetsList: [
        { name: "Wandsworth High Street", slug: "wandsworth-high-street", activationPct: 58, status: "making_progress", totalBusinesses: 14, participatingBusinesses: 8, campaigns: 1, fundingRaised: 6000, fundingTarget: 11000, communityActivities: 3, description: "Main shopping street in Wandsworth.", rewards: ["Wandsworth Riverside pass"] },
        { name: "Putney High Street", slug: "putney-high-street", activationPct: 50, status: "making_progress", totalBusinesses: 12, participatingBusinesses: 7, campaigns: 1, fundingRaised: 5000, fundingTarget: 9000, communityActivities: 2, description: "Affluent high street near the Thames.", rewards: ["Putney River walk badge"] },
      ],
    },
  ],
};

// ───────────────────── Sheffield ─────────────────────

const SHEFFIELD: CityHighStreetData = {
  citySlug: "sheffield",
  cityName: "Sheffield",
  localAreas: [
    {
      name: "Sheffield City Centre",
      slug: "sheffield-city-centre",
      activationPct: 51,
      status: "making_progress",
      businesses: 34,
      highStreets: 2,
      campaigns: 3,
      fundingRaised: 13000,
      fundingTarget: 22000,
      description: "Steel city revival with growing independent scene.",
      highStreetsList: [
        { name: "Fargate", slug: "fargate", activationPct: 55, status: "making_progress", totalBusinesses: 18, participatingBusinesses: 10, campaigns: 2, fundingRaised: 7500, fundingTarget: 12000, communityActivities: 4, description: "Main pedestrianised shopping area.", rewards: ["Steel City Shopper pass"] },
        { name: "Devonshire Quarter", slug: "devonshire-quarter", activationPct: 45, status: "making_progress", totalBusinesses: 16, participatingBusinesses: 8, campaigns: 1, fundingRaised: 5500, fundingTarget: 10000, communityActivities: 3, description: "Creative quarter with independent retailers.", rewards: ["Devonshire Quarter badge"] },
      ],
    },
  ],
};

// ───────────────────── Data Map ─────────────────────

const CITY_DATA_MAP: Record<string, CityHighStreetData> = {
  manchester: MANCHESTER,
  winchester: WINCHESTER,
  london: LONDON,
  birmingham: BIRMINGHAM,
  leeds: LEEDS,
  liverpool: LIVERPOOL,
  bristol: BRISTOL,
  glasgow: GLASGOW,
  edinburgh: EDINBURGH,
  // London Boroughs
  camden: CAMDEN,
  islington: ISLINGTON,
  southwark: SOUTHWARK,
  greenwich: GREENWICH,
  hackney: HACKNEY,
  lambeth: LAMBETH,
  westminster: WESTMINSTER,
  "tower-hamlets": TOWER_HAMLETS,
  wandsworth: WANDSWORTH,
  // Other cities
  sheffield: SHEFFIELD,
};



// ───────────────────── Public API ─────────────────────

export function getCityHighStreetData(citySlug: string): CityHighStreetData | null {
  return CITY_DATA_MAP[citySlug] ?? null;
}

export function getLocalAreaData(citySlug: string, areaSlug: string): LocalAreaData | null {
  const cityData = CITY_DATA_MAP[citySlug];
  if (!cityData) return null;
  return cityData.localAreas.find(a => a.slug === areaSlug) ?? null;
}

export function getHighStreetData(citySlug: string, areaSlug: string, streetSlug: string): HighStreetData | null {
  // Try the area's own data first (boroughs like "camden" have their own CITY_DATA_MAP entry)
  if (citySlug !== areaSlug) {
    const ownArea = getLocalAreaData(areaSlug, areaSlug);
    if (ownArea) {
      const found = ownArea.highStreetsList.find(s => s.slug === streetSlug);
      if (found) return found;
    }
  }
  // Try city-level data
  const areaData = getLocalAreaData(citySlug, areaSlug);
  if (areaData) {
    return areaData.highStreetsList.find(s => s.slug === streetSlug) ?? null;
  }
  // Try generated areas from getLocalAreasForCity (consistent with getHighStreetsForArea)
  const areas = getLocalAreasForCity(citySlug);
  const matchingArea = areas.find(a => a.slug === areaSlug);
  if (matchingArea) {
    return matchingArea.highStreetsList.find(s => s.slug === streetSlug) ?? null;
  }
  // Fallback: generate generic high streets (same params as getHighStreetsForArea)
  const genericHS = generateGenericHighStreets(citySlug, areaSlug, areaSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()));
  return genericHS.find(s => s.slug === streetSlug) ?? null;
}

export function hasHighStreetData(citySlug: string): boolean {
  return citySlug in CITY_DATA_MAP;
}

export function getCityStats(citySlug: string): {
  totalBusinesses: number;
  totalConsumers: number;
  totalCampaigns: number;
  totalHighStreets: number;
  totalLocalAreas: number;
  overallActivationPct: number;
} | null {
  // Use getLocalAreasForCity which handles both explicit and generated data
  const areas = getLocalAreasForCity(citySlug);
  if (areas.length > 0) {
    const totalBusinesses = areas.reduce((sum, a) => sum + a.businesses, 0);
    const totalHighStreets = areas.reduce((sum, a) => sum + a.highStreets, 0);
    const totalCampaigns = areas.reduce((sum, a) => sum + a.campaigns, 0);
    const totalLocalAreas = areas.length;
    const totalConsumers = Math.floor(totalBusinesses * 2.5);
    const overallActivationPct = Math.round(
      areas.reduce((sum, a) => sum + a.activationPct, 0) / areas.length
    );
    return { totalBusinesses, totalConsumers, totalCampaigns, totalHighStreets, totalLocalAreas, overallActivationPct };
  }

  // Generate reasonable defaults for any city
  const seed = citySlug.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const totalLocalAreas = 2 + (Math.abs(seed) % 2);
  const highStreetsPerArea = 1 + (Math.abs(seed >> 4) % 2);
  const businessesPerStreet = 8 + (Math.abs(seed >> 8) % 12);
  const totalHighStreets = totalLocalAreas * highStreetsPerArea;
  const totalBusinesses = totalHighStreets * businessesPerStreet;
  const totalCampaigns = 1 + (Math.abs(seed >> 12) % 4);
  return {
    totalLocalAreas,
    totalHighStreets,
    totalBusinesses,
    totalConsumers: Math.floor(totalBusinesses * 2.5),
    totalCampaigns,
    overallActivationPct: 50 + (Math.abs(seed >> 16) % 30),
  };
}

export function getLocalAreasForCity(citySlug: string): LocalAreaData[] {
  const cityData = CITY_DATA_MAP[citySlug];
  if (cityData) return cityData.localAreas;

  // Generate local areas for ALL cities not in CITY_DATA_MAP
  const seed = citySlug.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const areaCount = 2 + (Math.abs(seed) % 2); // 2-3 areas
  const areaNames = generateAreaNames(citySlug, areaCount);
  const activationBase = 50 + (Math.abs(seed >> 16) % 30); // 50-79%

  return areaNames.map((areaName, i) => {
    const areaSeed = seed + i * 31;
    const activationPct = Math.max(30, activationBase + (Math.abs(areaSeed >> 8) % 15) - 7);
    const highStreetCount = 1 + (Math.abs(areaSeed >> 4) % 2); // 1-2
    const businessesPerStreet = 8 + (Math.abs(areaSeed >> 8) % 12);
    const totalBusinesses = highStreetCount * businessesPerStreet;
    const fundingTarget = 15000 + (Math.abs(areaSeed >> 12) % 20000);
    const fundingRaised = Math.floor(fundingTarget * activationPct / 100);

    return {
      name: areaName,
      slug: areaName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      activationPct,
      status: activationBase > 65 ? "active" as const : "making_progress" as const,
      businesses: totalBusinesses,
      highStreets: highStreetCount,
      campaigns: 1 + (Math.abs(areaSeed >> 16) % 3),
      fundingRaised,
      fundingTarget,
      description: `${areaName} — a vibrant local area in ${citySlug.charAt(0).toUpperCase() + citySlug.slice(1)} with active community participation.`,
      highStreetsList: generateHighStreets(citySlug, areaName, highStreetCount, areaSeed),
    };
  });
}

function generateAreaNames(citySlug: string, count: number): string[] {
  const city = citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace(/-/g, " ");
  const prefixes = ["North", "South", "East", "West", "Central", "Town Centre", "High Street", "Old Town", "New Town", "Riverside"];
  const suffixes = ["District", "Quarter", "Ward", "Precinct", "Village", "Common", "Gate", "End"];
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const usePrefix = (Math.abs(citySlug.charCodeAt(0) * 31 + i) % 2) === 0;
    if (usePrefix) {
      names.push(`${prefixes[i % prefixes.length]} ${city}`);
    } else {
      names.push(`${city} ${suffixes[i % suffixes.length]}`);
    }
  }
  return names;
}

function generateHighStreets(_citySlug: string, areaName: string, count: number, seed: number): HighStreetData[] {
  const streets: HighStreetData[] = [];
  const streetNames = ["High Street", "Main Road", "Market Street", "Church Lane", "Station Road", "Broadway", "The Parade", "Market Place"];
  for (let i = 0; i < count; i++) {
    const streetSeed = seed + i * 17;
    const streetName = `${areaName} ${streetNames[i % streetNames.length]}`;
    const businessesPerStreet = 8 + (Math.abs(streetSeed >> 8) % 12);
    const activationPct = 40 + (Math.abs(streetSeed >> 4) % 40);
    const fundingTarget = 8000 + (Math.abs(streetSeed >> 12) % 12000);
    streets.push({
      name: streetName,
      slug: streetName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      activationPct,
      status: activationPct > 65 ? "active" as const : "making_progress" as const,
      totalBusinesses: businessesPerStreet,
      participatingBusinesses: Math.floor(businessesPerStreet * 0.6),
      campaigns: 1 + (Math.abs(streetSeed >> 16) % 2),
      fundingRaised: Math.floor(fundingTarget * activationPct / 100),
      fundingTarget,
      communityActivities: 2 + (Math.abs(streetSeed >> 20) % 4),
      description: `${streetName} in ${areaName} — a thriving local high street.`,
      rewards: ["Local Shopper Badge"],
    });
  }
  return streets;
}

export function getHighStreetsForArea(citySlug: string, areaSlug: string): HighStreetData[] {
  // Try the area's own data first (boroughs have their own CITY_DATA_MAP entry)
  if (citySlug !== areaSlug) {
    const ownArea = getLocalAreaData(areaSlug, areaSlug);
    if (ownArea) return ownArea.highStreetsList;
  }
  // Try city-level data
  const areaData = getLocalAreaData(citySlug, areaSlug);
  if (areaData) return areaData.highStreetsList;

  // For generated areas: the area might be a borough with its own generated local areas.
  // Check getLocalAreasForCity(areaSlug) first — this matches what getLocationChildren
  // generates for borough pages (LOCAL_AREA children generated from the borough's own slug).
  const ownAreas = getLocalAreasForCity(areaSlug);
  const ownMatch = ownAreas.find(a => a.slug === areaSlug);
  if (ownMatch) return ownMatch.highStreetsList;

  // Also check parent city's generated areas
  const cityAreas = getLocalAreasForCity(citySlug);
  const cityMatch = cityAreas.find(a => a.slug === areaSlug);
  if (cityMatch) return cityMatch.highStreetsList;

  // Fallback: generate generic high streets
  return generateGenericHighStreets(citySlug, areaSlug, areaSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()));
}

// ───────────────────── Active/In-Progress Cities ─────────────────────
// Any city NOT in NEEDS_ACTIVATION_CITIES gets generated data.
// The SEEDS data has 6 active + 10 making_progress cities with explicit data;
// remaining cities use citySeed() which alternates making_progress/needs_activation.

const NEEDS_ACTIVATION_CITIES = new Set([
  "bradford", "newcastle", "nottingham",
  "leicester", "coventry", "southampton", "reading",
  "brent", "croydon", "hammersmith-fulham",
  "armagh", "bath", "carlisle", "chelmsford", "chester", "chichester",
  "derby", "doncaster", "dundee", "durham", "ely", "exeter", "gloucester",
  "hereford", "inverness", "kingston-upon-hull", "lancaster",
  "lichfield", "lincoln", "lisburn", "londonderry", "newport",
  "norwich", "oxford", "peterborough", "plymouth", "portsmouth",
  "preston", "ripon", "rochester", "salford", "salisbury",
  "st-asaph", "st-davids", "stirling", "stoke-on-trent", "sunderland",
  "swansea", "truro", "wakefield", "wells", "wolverhampton",
  "wrexham", "york", "bangor", "colchester", "milton-keynes",
  "northampton", "swindon", "wigan", "blackpool", "bournemouth",
]);

export function isCityActiveOrInProgress(citySlug: string): boolean {
  return !NEEDS_ACTIVATION_CITIES.has(citySlug);
}

export function isCityNeedsActivation(citySlug: string): boolean {
  return NEEDS_ACTIVATION_CITIES.has(citySlug);
}

// ───────────────────── Demo Businesses ─────────────────────

export interface DemoBusiness {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  participating: boolean;
  joinedDate: string;
  fundingContribution: number;
  avatar: string;
}

const BUSINESS_TYPES = [
  "Café", "Restaurant", "Bakery", "Bookshop", "Florist", "Boutique",
  "Pharmacy", "Hair Salon", "Gym", "Pet Shop", "Dry Cleaner", "Butcher",
  "Grocery Store", "Electronics Shop", "Plumber", "Electrician", "Dentist",
  "Optician", "Tailor", "Jeweller", "Toy Shop", "Art Gallery", "Gallery",
  "Antique Shop", "Wine Bar", "Pub", "Pizzeria", "Fish & Chips", "Takeaway",
  "Law Accountancy", "Estate Agent", "Travel Agency", "Print Shop",
];

const BUSINESS_SUFFIXES = [
  "& Sons", "Co.", "Express", "Direct", "Plus", "Pro", "Hub", "House",
  "Centre", "Store", "Shop", "Market", "Quarter", "House", "Place",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getBusinessesForHighStreet(
  citySlug: string,
  areaSlug: string,
  streetSlug: string,
): DemoBusiness[] {
  const street = getHighStreetData(citySlug, areaSlug, streetSlug);
  if (!street) return [];
  const count = street.participatingBusinesses;
  const seed = (citySlug + areaSlug + streetSlug).split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const businesses: DemoBusiness[] = [];
  for (let i = 0; i < count; i++) {
    const bSeed = seed + i * 47;
    const typeIdx = Math.abs(bSeed) % BUSINESS_TYPES.length;
    const suffixIdx = Math.abs(bSeed >> 8) % BUSINESS_SUFFIXES.length;
    const type = BUSINESS_TYPES[typeIdx] || "Shop";
    const suffix = BUSINESS_SUFFIXES[suffixIdx] || "Co.";
    const isActive = seededRandom(bSeed) > 0.25;
    businesses.push({
      id: `${streetSlug}-biz-${i}`,
      name: `${type} ${suffix}`,
      type,
      category: type.toLowerCase(),
      description: `${type} on ${street.name} — ${isActive ? "actively participating" : "registered"} in the hub.`,
      participating: isActive,
      joinedDate: new Date(Date.now() - (seededRandom(bSeed + 1) * 90) * 24 * 60 * 60 * 1000).toISOString(),
      fundingContribution: Math.floor(50 + seededRandom(bSeed + 2) * 450),
      avatar: `🏢`,
    });
  }
  return businesses;
}

// ───────────────────── Generic High Streets ─────────────────────
// Generates high streets for any local area that doesn't have explicit data.

function generateGenericHighStreets(
  citySlug: string,
  areaSlug: string,
  areaName: string,
): HighStreetData[] {
  const h = (citySlug + areaSlug).split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  const count = 2 + (Math.abs(h) % 2); // 2-3 high streets
  const streetNames = ["High Street", "Market Road", "Station Parade", "Church Lane", "The Broadway"];
  const streets: HighStreetData[] = [];
  for (let i = 0; i < count; i++) {
    const seed = h + i * 37;
    const streetName = `${areaName} ${streetNames[i % streetNames.length]}`;
    const businessesPerStreet = 8 + (Math.abs(seed >> 8) % 12);
    const activationPct = 40 + (Math.abs(seed >> 4) % 40);
    const fundingTarget = 8000 + (Math.abs(seed >> 12) % 12000);
    streets.push({
      name: streetName,
      slug: streetName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      activationPct,
      status: activationPct > 65 ? "active" : "making_progress",
      totalBusinesses: businessesPerStreet,
      participatingBusinesses: Math.floor(businessesPerStreet * 0.6),
      campaigns: 1 + (Math.abs(seed >> 16) % 2),
      fundingRaised: Math.floor(fundingTarget * activationPct / 100),
      fundingTarget,
      communityActivities: 2 + (Math.abs(seed >> 20) % 4),
      description: `${streetName} in ${areaName} — a thriving local high street.`,
      rewards: ["Local Shopper Badge"],
    });
  }
  return streets;
}

export function getGenericHighStreetsForArea(
  citySlug: string,
  areaSlug: string,
  areaName: string,
): HighStreetData[] {
  return generateGenericHighStreets(citySlug, areaSlug, areaName);
}

// ───────────────────── High Street Campaigns ─────────────────────

import type { DemoCampaign } from "./demo";

export function getDemoCampaignsForHighStreet(
  citySlug: string,
  areaSlug: string,
  streetSlug: string,
): DemoCampaign[] {
  const street = getHighStreetData(citySlug, areaSlug, streetSlug);
  const streetName = street?.name || streetSlug.replace(/-/g, " ");
  const areaName = areaSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const cityName = citySlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const count = street?.campaigns ?? 2;
  const h = citySlug.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    + streetSlug.split("").reduce((acc, c) => ((acc << 3) + c.charCodeAt(0)) | 0, 0);

  const categories = ["Local Hub", "Business", "Community", "High Street"];
  const modes: ("donation" | "fund" | "sponsor")[] = ["donation", "fund", "sponsor"];
  const audiences: ("business" | "consumer")[] = ["business", "consumer"];
  const images = [
    "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=400&fit=crop",
  ];

  const campaigns: DemoCampaign[] = [];
  // Ensure at least 1 business and 1 consumer campaign per high street
  const minCampaigns = Math.max(count, 2);
  for (let i = 0; i < minCampaigns; i++) {
    const seed = h + i * 37;
    const catIdx = Math.abs(seed) % categories.length;
    const modeIdx = Math.abs(seed >> 4) % modes.length;
    const audience = i === 0 ? "business" : i === 1 ? "consumer" : audiences[Math.abs(seed >> 8) % audiences.length];
    const goalAmount = 3000 + (Math.abs(seed >> 8) % 12000);
    const catName = categories[catIdx] || "Local Hub";
    const mode = modes[modeIdx] || "donation";
    campaigns.push({
      id: `hs-campaign-${citySlug}-${areaSlug}-${streetSlug}-${i}`,
      slug: `${streetSlug}-campaign-${i + 1}`,
      title: `${catName} Fund for ${streetName}`,
      shortDescription: `Support the ${catName.toLowerCase()} initiative on ${streetName}, ${areaName}. Help build a stronger local community in ${cityName}.`,
      mode,
      goalAmount,
      raisedAmount: Math.floor(goalAmount * (0.15 + (Math.abs(seed >> 12) % 50) / 100)),
      deadline: new Date(Date.now() + (30 + (Math.abs(seed >> 16) % 60)) * 24 * 60 * 60 * 1000).toISOString(),
      featuredImage: images[i % images.length]!,
      media: [
        { id: `hs-campaign-${citySlug}-${areaSlug}-${streetSlug}-${i}-1`, type: "image" as const, url: images[i % images.length]!, alt: `${catName} campaign for ${streetName}` },
        { id: `hs-campaign-${citySlug}-${areaSlug}-${streetSlug}-${i}-2`, type: "image" as const, url: images[(i + 1) % images.length]!, alt: `${streetName} local area` },
      ],
      category: { name: catName, slug: catName.toLowerCase().replace(/ /g, "-") },
      author: { firstName: "Local", lastName: "Hub" },
      location: `${streetName}, ${areaName}`,
      tags: ["hub-activation", citySlug, areaSlug, streetSlug],
      targetAudience: audience,
      campaignType: catName,
      participationTypes: ["fund", "donate"],
    });
  }
  return campaigns;
}

// ── Get all high streets across all local areas for a city ──────────
export function getHighStreetsForCity(citySlug: string): HighStreetData[] {
  const areas = getLocalAreasForCity(citySlug);
  const allStreets: HighStreetData[] = [];
  areas.forEach(area => {
    getHighStreetsForArea(citySlug, area.slug).forEach(street => {
      allStreets.push(street);
    });
  });
  return allStreets;
}
