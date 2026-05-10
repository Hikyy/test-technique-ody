export type SparkPoint = { date: string; value: number };

export type KpiCardData = {
  value: number;
  delta: number;
  spark: SparkPoint[];
};

export type TopDishData = {
  dish_id: string;
  name: string;
  qty: number;
  revenue_cents: number;
};

export type DashboardOverviewData = {
  range: { from: string; to: string };
  couverts_du_jour: KpiCardData;
  ca_estime: KpiCardData;
  panier_moyen: KpiCardData;
  taux_annulation: KpiCardData;
  top_plats: TopDishData[];
};

export type CurrentUserData = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};
