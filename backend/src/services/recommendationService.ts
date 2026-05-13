import * as tripModel from "../models/tripModel.js";
import * as voteService from "./voteService.js";

type BudgetStats = {
  accommodation?: { q2?: number };
  transport?: { q2?: number };
  food?: { q2?: number };
  other?: { q2?: number };
};

export type PlaceCategory =
  | "nature"
  | "culture"
  | "food"
  | "cafe"
  | "adventure"
  | "shopping"
  | "relax";

export interface PlaceCatalogItem {
  id: string;
  name: string;
  province: string;
  category: PlaceCategory;
  estimatedCost: number;
  durationHours: number;
  lat: number;
  lng: number;
  popularity: number;
  tags: string[];
}

export interface RecommendationMetrics {
  voteScore: number;
  preferenceMatch: number;
  budgetFit: number;
  popularity: number;
  distanceScore: number;
  finalScore: number;
}

export interface PlaceRecommendation {
  place: PlaceCatalogItem;
  metrics: RecommendationMetrics;
  reasons: string[];
}

export interface ItineraryStop {
  order: number;
  placeId: string;
  name: string;
  province: string;
  category: PlaceCategory;
  estimatedCost: number;
  durationHours: number;
  travelDistanceKmFromPrevious: number;
}

export interface ItineraryDay {
  day: number;
  totalCost: number;
  totalHours: number;
  totalTravelKm: number;
  stops: ItineraryStop[];
}

const PLACES: PlaceCatalogItem[] = [
  {
    id: "chiang-mai-doi-suthep",
    name: "Doi Suthep",
    province: "Chiang Mai",
    category: "culture",
    estimatedCost: 80,
    durationHours: 2,
    lat: 18.8049,
    lng: 98.9215,
    popularity: 0.95,
    tags: ["temple", "viewpoint", "culture"],
  },
  {
    id: "chiang-mai-nimman",
    name: "Nimman Cafe District",
    province: "Chiang Mai",
    category: "cafe",
    estimatedCost: 350,
    durationHours: 3,
    lat: 18.8002,
    lng: 98.967,
    popularity: 0.82,
    tags: ["cafe", "shopping", "photo"],
  },
  {
    id: "chiang-mai-doi-inthanon",
    name: "Doi Inthanon National Park",
    province: "Chiang Mai",
    category: "nature",
    estimatedCost: 500,
    durationHours: 6,
    lat: 18.5889,
    lng: 98.4867,
    popularity: 0.9,
    tags: ["nature", "mountain", "viewpoint"],
  },
  {
    id: "bangkok-grand-palace",
    name: "Grand Palace",
    province: "Bangkok",
    category: "culture",
    estimatedCost: 500,
    durationHours: 3,
    lat: 13.7500,
    lng: 100.4913,
    popularity: 0.94,
    tags: ["temple", "history", "culture"],
  },
  {
    id: "bangkok-yaowarat",
    name: "Yaowarat Street Food",
    province: "Bangkok",
    category: "food",
    estimatedCost: 450,
    durationHours: 3,
    lat: 13.7400,
    lng: 100.5088,
    popularity: 0.92,
    tags: ["food", "night", "street-food"],
  },
  {
    id: "bangkok-iconsiam",
    name: "ICONSIAM",
    province: "Bangkok",
    category: "shopping",
    estimatedCost: 700,
    durationHours: 3,
    lat: 13.7265,
    lng: 100.5104,
    popularity: 0.86,
    tags: ["shopping", "food", "river"],
  },
  {
    id: "phuket-patong",
    name: "Patong Beach",
    province: "Phuket",
    category: "relax",
    estimatedCost: 400,
    durationHours: 4,
    lat: 7.8969,
    lng: 98.2966,
    popularity: 0.88,
    tags: ["beach", "nightlife", "relax"],
  },
  {
    id: "phuket-old-town",
    name: "Phuket Old Town",
    province: "Phuket",
    category: "culture",
    estimatedCost: 300,
    durationHours: 3,
    lat: 7.8840,
    lng: 98.3897,
    popularity: 0.84,
    tags: ["culture", "photo", "food"],
  },
  {
    id: "krabi-railay",
    name: "Railay Beach",
    province: "Krabi",
    category: "nature",
    estimatedCost: 500,
    durationHours: 5,
    lat: 8.0100,
    lng: 98.8397,
    popularity: 0.91,
    tags: ["beach", "nature", "adventure"],
  },
  {
    id: "kanchanaburi-erawan",
    name: "Erawan Waterfall",
    province: "Kanchanaburi",
    category: "nature",
    estimatedCost: 350,
    durationHours: 5,
    lat: 14.3735,
    lng: 99.1446,
    popularity: 0.87,
    tags: ["waterfall", "nature", "walking"],
  },
];

const CATEGORY_KEYWORDS: Record<PlaceCategory, string[]> = {
  nature: ["nature", "mountain", "beach", "waterfall", "viewpoint"],
  culture: ["culture", "temple", "history"],
  food: ["food", "street-food", "night"],
  cafe: ["cafe", "photo"],
  adventure: ["adventure", "walking"],
  shopping: ["shopping"],
  relax: ["relax", "beach"],
};

const PROVINCE_ALIASES: Record<string, string> = {
  "bangkok": "bangkok",
  "กรุงเทพ": "bangkok",
  "กรุงเทพมหานคร": "bangkok",
  "chiang mai": "chiang mai",
  "เชียงใหม่": "chiang mai",
  "phuket": "phuket",
  "ภูเก็ต": "phuket",
  "krabi": "krabi",
  "กระบี่": "krabi",
  "kanchanaburi": "kanchanaburi",
  "กาญจนบุรี": "kanchanaburi",
};

const normalizeProvince = (value: string) => {
  const key = value.trim().toLowerCase();
  return PROVINCE_ALIASES[key] ?? key;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const distanceKm = (a: PlaceCatalogItem, b: PlaceCatalogItem) => {
  const radius = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
};

const getMedianBudget = (stats: BudgetStats | undefined) => {
  if (!stats) return 0;
  const values = [
    stats.accommodation?.q2 ?? 0,
    stats.transport?.q2 ?? 0,
    stats.food?.q2 ?? 0,
    stats.other?.q2 ?? 0,
  ];
  return values.reduce((sum, value) => sum + Number(value || 0), 0);
};

const inferCategoryWeights = (tripDescription: string | null | undefined) => {
  const lower = (tripDescription ?? "").toLowerCase();
  const weights = new Map<PlaceCategory, number>();

  for (const category of Object.keys(CATEGORY_KEYWORDS) as PlaceCategory[]) {
    const hitCount = CATEGORY_KEYWORDS[category].filter((word) =>
      lower.includes(word)
    ).length;
    weights.set(category, hitCount > 0 ? 0.8 + hitCount * 0.1 : 0.45);
  }

  if (!lower.trim()) {
    weights.set("nature", 0.65);
    weights.set("culture", 0.6);
    weights.set("food", 0.6);
  }

  return weights;
};

const buildItinerary = (
  recommendations: PlaceRecommendation[],
  numDays: number
): ItineraryDay[] => {
  const days = Math.max(1, numDays || 1);
  const pools = recommendations.slice(0, Math.min(8, recommendations.length));
  const itinerary: ItineraryDay[] = Array.from({ length: days }, (_, idx) => ({
    day: idx + 1,
    totalCost: 0,
    totalHours: 0,
    totalTravelKm: 0,
    stops: [],
  }));

  let remaining = [...pools];
  let previous: PlaceCatalogItem | null = null;
  let dayIndex = 0;

  while (remaining.length > 0) {
    remaining.sort((a, b) => {
      if (!previous) return b.metrics.finalScore - a.metrics.finalScore;
      return distanceKm(previous, a.place) - distanceKm(previous, b.place);
    });

    const next = remaining.shift();
    if (!next) break;

    const currentDay = itinerary[dayIndex]!;
    const travel = previous ? distanceKm(previous, next.place) : 0;

    if (currentDay.totalHours + next.place.durationHours > 9 && dayIndex < days - 1) {
      dayIndex += 1;
      previous = null;
    }

    const targetDay = itinerary[dayIndex]!;
    const distanceFromPrevious = previous ? distanceKm(previous, next.place) : 0;

    targetDay.stops.push({
      order: targetDay.stops.length + 1,
      placeId: next.place.id,
      name: next.place.name,
      province: next.place.province,
      category: next.place.category,
      estimatedCost: next.place.estimatedCost,
      durationHours: next.place.durationHours,
      travelDistanceKmFromPrevious: Math.round(distanceFromPrevious * 10) / 10,
    });
    targetDay.totalCost += next.place.estimatedCost;
    targetDay.totalHours += next.place.durationHours;
    targetDay.totalTravelKm += distanceFromPrevious || travel;

    previous = next.place;
    dayIndex = Math.min(days - 1, dayIndex);
  }

  return itinerary.map((day) => ({
    ...day,
    totalCost: Math.round(day.totalCost),
    totalHours: Math.round(day.totalHours * 10) / 10,
    totalTravelKm: Math.round(day.totalTravelKm * 10) / 10,
  }));
};

export async function getTripRecommendations(tripId: string, userId: string) {
  const summary = await tripModel.getTripSummaryById(tripId);

  if (!summary) {
    throw new Error("Trip not found");
  }

  const isMember = summary.members.some((member) => member.user_id === userId);
  if (!isMember) {
    throw new Error("FORBIDDEN");
  }

  const [budgetVotes, locationResult, dateOptions] = await Promise.all([
    voteService.getvoteBudget(tripId, userId),
    voteService.getvoteLocation(tripId, userId),
    voteService.getvoteDate(tripId, userId),
  ]);

  const topLocations = locationResult.locationVotesTotal ?? [];
  const maxVoteScore = Math.max(
    1,
    ...topLocations.map((item: any) => Number(item.total_score || 0))
  );
  const locationScoreByProvince = new Map<string, number>(
    topLocations.map((item: any) => [
      normalizeProvince(item.place),
      Number(item.total_score || 0) / maxVoteScore,
    ])
  );

  const tripBudget = getMedianBudget(budgetVotes.stats as BudgetStats);
  const perPlaceBudget = tripBudget > 0 ? tripBudget / Math.max(1, Number(summary.trip.num_days || 1) * 2) : 0;
  const categoryWeights = inferCategoryWeights(summary.trip.description);

  const provinceCandidates =
    topLocations.length > 0
      ? new Set(topLocations.slice(0, 3).map((item: any) => normalizeProvince(item.place)))
      : null;

  const provinceMatchedPlaces = PLACES.filter((place) => {
    if (!provinceCandidates) return true;
    return provinceCandidates.has(normalizeProvince(place.province));
  });
  const candidates = provinceMatchedPlaces.length > 0 ? provinceMatchedPlaces : PLACES;

  const recommendations = candidates
    .map<PlaceRecommendation>((place) => {
      const voteScore = locationScoreByProvince.get(normalizeProvince(place.province)) ?? 0.45;
      const preferenceMatch = categoryWeights.get(place.category) ?? 0.45;
      const budgetFit = perPlaceBudget > 0
        ? clamp01(1 - Math.abs(place.estimatedCost - perPlaceBudget) / Math.max(perPlaceBudget, place.estimatedCost))
        : 0.65;
      const popularity = place.popularity;
      const distanceScore = 0.75;
      const finalScore =
        voteScore * 0.35 +
        preferenceMatch * 0.3 +
        budgetFit * 0.2 +
        popularity * 0.1 +
        distanceScore * 0.05;

      const metrics = {
        voteScore: Math.round(voteScore * 100),
        preferenceMatch: Math.round(preferenceMatch * 100),
        budgetFit: Math.round(budgetFit * 100),
        popularity: Math.round(popularity * 100),
        distanceScore: Math.round(distanceScore * 100),
        finalScore: Math.round(finalScore * 100),
      };

      const reasons = [
        `Province vote signal contributes ${metrics.voteScore}/100.`,
        `${place.category} matches inferred group preference at ${metrics.preferenceMatch}/100.`,
        `Estimated activity cost is ${metrics.budgetFit}/100 aligned with the group budget.`,
      ];

      if (place.popularity >= 0.85) {
        reasons.push("High popularity makes it a reliable group-friendly choice.");
      }

      return { place, metrics, reasons };
    })
    .sort((a, b) => b.metrics.finalScore - a.metrics.finalScore)
    .slice(0, 8);

  const itinerary = buildItinerary(recommendations, Number(summary.trip.num_days || 1));

  const evaluation = {
    groupAgreementScore: Math.round(
      (topLocations[0]?.total_score && summary.totalmembers
        ? Number(topLocations[0].total_score) / Math.max(1, summary.totalmembers * 3)
        : 0.5) * 100
    ),
    budgetConfidenceScore: Math.round(
      clamp01((budgetVotes.filledMembers ?? 0) / Math.max(1, budgetVotes.totalMembers ?? 1)) * 100
    ),
    availabilityConfidenceScore: Math.round(
      clamp01((dateOptions.summary?.actualVote ?? 0) / Math.max(1, dateOptions.summary?.totalMembers ?? 1)) * 100
    ),
    recommendationCount: recommendations.length,
  };

  return {
    tripId,
    generatedAt: new Date().toISOString(),
    inputs: {
      topLocations: topLocations.slice(0, 3),
      medianBudget: tripBudget,
      bestDates: dateOptions.recommendation?.dates ?? [],
    },
    recommendations,
    itinerary,
    evaluation,
  };
}
