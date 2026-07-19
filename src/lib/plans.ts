export const PLAN_LIMITS: Record<string, number> = {
  trial: 20,
  basic: 100,
  pro: Infinity,
};

export const PLAN_LABELS: Record<string, string> = {
  trial: "Sinov",
  basic: "Basic",
  pro: "Pro",
};

export const PLAN_PRICES: Record<string, number> = {
  trial: 0,
  basic: 50000,
  pro: 150000,
};

export function getCustomerLimit(plan: string): number {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial;
}

export type PricingTier = {
  plan: "trial" | "basic" | "pro";
  name: string;
  price: number;
  customerLimit: string;
  features: string[];
};

export const PRICING_TIERS: PricingTier[] = [
  {
    plan: "trial",
    name: "Sinov",
    price: 0,
    customerLimit: "20 mijozgacha",
    features: ["30 kun bepul", "Mijozlar va qarzlar", "Dashboard statistikasi"],
  },
  {
    plan: "basic",
    name: "Basic",
    price: 50000,
    customerLimit: "100 mijozgacha",
    features: [
      "Mijozlar va qarzlar",
      "Dashboard statistikasi",
      "Telegram orqali eslatma",
      "Excel eksport",
    ],
  },
  {
    plan: "pro",
    name: "Pro",
    price: 150000,
    customerLimit: "Cheksiz mijoz",
    features: [
      "Basic'dagi barcha imkoniyatlar",
      "Xodimlar (multi-user)",
      "Kengaytirilgan hisobotlar",
      "SMS eslatma (tez orada)",
    ],
  },
];
