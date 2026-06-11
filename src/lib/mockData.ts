/**
 * Mock data for screens whose backend endpoints are not yet implemented in
 * the SalesCoach AI FastAPI service (auth, dashboard summaries, prioritized
 * merchant lists, manager analytics). The chat & merchant-insight endpoints
 * hit the real backend via src/lib/api.ts when available.
 */

export interface Merchant {
  id: string;
  name: string;
  tier: "Gold" | "Silver" | "Bronze" | "New";
  category: string;
  area: string;
  region: string;
  priorityScore: number;
  transactionTrend: number; // %
  daysSinceVisit: number;
  walletBalance: number;
  complaints: number;
  campaignStatus: "Active" | "Inactive" | "Pending" | "None";
  recommendationId: string;
  recommendation: string;
  status: "Pending" | "In Progress" | "Done";
}

const MERCHANT_SEED: Omit<Merchant, "recommendationId" | "status">[] = [
  {
    id: "m-001", name: "Aling Rosa's Sari-Sari", tier: "Gold", category: "Sari-Sari Store",
    area: "Quezon City", region: "NCR", priorityScore: 94.2, transactionTrend: -38,
    daysSinceVisit: 21, walletBalance: 480, complaints: 3, campaignStatus: "Inactive",
    recommendation: "Urgent: Transaction decline of 38% combined with 3 unresolved complaints. Prioritize this outlet for an immediate visit and discuss recovery plan.",
  },
  {
    id: "m-002", name: "Mang Pedro's Mini Mart", tier: "Silver", category: "Convenience Store",
    area: "Makati", region: "NCR", priorityScore: 88.7, transactionTrend: -22,
    daysSinceVisit: 14, walletBalance: 1240, complaints: 1, campaignStatus: "Pending",
    recommendation: "Visit merchant within 24 hours — transaction volume has dropped 22% over the past week. Re-engage on the pending GCash campaign activation.",
  },
  {
    id: "m-003", name: "KJ's Mobile Hub", tier: "Gold", category: "Mobile & Accessories",
    area: "Pasig", region: "NCR", priorityScore: 81.4, transactionTrend: 12,
    daysSinceVisit: 9, walletBalance: 3200, complaints: 0, campaignStatus: "Active",
    recommendation: "Discuss tier upgrade readiness — consistent transaction growth (+12%) over the past 30 days. Cross-sell additional GCash services.",
  },
  {
    id: "m-004", name: "Nanay Cora's Bakery", tier: "Bronze", category: "Food & Beverage",
    area: "Manila", region: "NCR", priorityScore: 76.9, transactionTrend: -8,
    daysSinceVisit: 28, walletBalance: 220, complaints: 2, campaignStatus: "None",
    recommendation: "Merchant has not been visited in 28 days. Conduct a routine check-in, top up wallet promotion, and resolve 2 outstanding complaints.",
  },
  {
    id: "m-005", name: "Diamond Pharmacy", tier: "Silver", category: "Pharmacy",
    area: "Taguig", region: "NCR", priorityScore: 72.1, transactionTrend: 4,
    daysSinceVisit: 11, walletBalance: 1850, complaints: 0, campaignStatus: "Active",
    recommendation: "Steady performer. Schedule a relationship visit to discuss product expansion opportunities.",
  },
  {
    id: "m-006", name: "Sunshine Water Station", tier: "Bronze", category: "Water Refilling",
    area: "Pasig", region: "NCR", priorityScore: 68.4, transactionTrend: -15,
    daysSinceVisit: 19, walletBalance: 540, complaints: 1, campaignStatus: "Inactive",
    recommendation: "Investigate 15% transaction drop. Discuss wallet top-up promotion and re-enroll in nearest active campaign.",
  },
  {
    id: "m-007", name: "Lucky Hardware", tier: "Silver", category: "Hardware",
    area: "Quezon City", region: "NCR", priorityScore: 64.8, transactionTrend: 8,
    daysSinceVisit: 16, walletBalance: 2110, complaints: 0, campaignStatus: "Active",
    recommendation: "Healthy growth (+8%). Recommend product expansion — only 4 active GCash products today.",
  },
  {
    id: "m-008", name: "Tita Joy's E-Load Center", tier: "New", category: "Mobile & Accessories",
    area: "Makati", region: "NCR", priorityScore: 58.3, transactionTrend: 22,
    daysSinceVisit: 6, walletBalance: 900, complaints: 0, campaignStatus: "Pending",
    recommendation: "Recently onboarded with strong early traction (+22%). Activate pending campaign and schedule onboarding follow-up.",
  },
];

export const MOCK_MERCHANTS: Merchant[] = MERCHANT_SEED.map((m) => ({
  ...m,
  recommendationId: `r-${m.id}`,
  status: "Pending",
}));

export interface DspDashboard {
  agentName: string;
  visitsToday: number;
  visitsGoal: number;
  conversionRate: number;
  pendingActions: number;
  weeklyVisits: { day: string; visits: number; goal: number }[];
}

export const MOCK_DSP_DASHBOARD: DspDashboard = {
  agentName: "Miguel Dela Cruz",
  visitsToday: 6,
  visitsGoal: 10,
  conversionRate: 62,
  pendingActions: 8,
  weeklyVisits: [
    { day: "Mon", visits: 8, goal: 10 },
    { day: "Tue", visits: 11, goal: 10 },
    { day: "Wed", visits: 7, goal: 10 },
    { day: "Thu", visits: 9, goal: 10 },
    { day: "Fri", visits: 6, goal: 10 },
    { day: "Sat", visits: 4, goal: 6 },
  ],
};

export interface ManagerSummary {
  totalDsps: number;
  totalMerchants: number;
  avgPriorityScore: number;
  weeklyVisits: number;
  team: {
    id: string;
    name: string;
    area: string;
    visits: number;
    conversion: number;
    score: number;
  }[];
  visitsByArea: { area: string; visits: number; target: number }[];
}

export const MOCK_MANAGER: ManagerSummary = {
  totalDsps: 12,
  totalMerchants: 384,
  avgPriorityScore: 71.4,
  weeklyVisits: 268,
  team: [
    { id: "u1", name: "Miguel Dela Cruz", area: "Quezon City", visits: 42, conversion: 71, score: 92 },
    { id: "u2", name: "Andrea Santos", area: "Makati", visits: 38, conversion: 68, score: 88 },
    { id: "u3", name: "Jomar Reyes", area: "Pasig", visits: 35, conversion: 64, score: 85 },
    { id: "u4", name: "Bianca Cruz", area: "Manila", visits: 31, conversion: 59, score: 79 },
    { id: "u5", name: "Patrick Lim", area: "Taguig", visits: 28, conversion: 55, score: 74 },
    { id: "u6", name: "Rina Garcia", area: "Quezon City", visits: 24, conversion: 51, score: 69 },
  ],
  visitsByArea: [
    { area: "QC",     visits: 66, target: 80 },
    { area: "Makati", visits: 58, target: 70 },
    { area: "Pasig",  visits: 49, target: 60 },
    { area: "Manila", visits: 42, target: 55 },
    { area: "Taguig", visits: 35, target: 50 },
    { area: "BGC",    visits: 18, target: 30 },
  ],
};

export async function mockFetch<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
