export type SeedDish = {
  category: string;
  name: string;
  description: string;
  priceCents: number;
  available: boolean;
};

export const SEED_DISHES: ReadonlyArray<SeedDish> = [
  // Entrées
  {
    category: "Entrées",
    name: "Tartare de daurade royale",
    description: "Daurade, citron caviar, huile d'olive de Nyons, fleur de sel",
    priceCents: 2400,
    available: true,
  },
  {
    category: "Entrées",
    name: "Saint-Jacques rôties",
    description: "Coquilles de plongée, beurre noisette, topinambour",
    priceCents: 3200,
    available: true,
  },
  {
    category: "Entrées",
    name: "Velouté de potimarron",
    description: "Châtaignes torréfiées, huile de noisette, croûtons au lard",
    priceCents: 1800,
    available: true,
  },
  {
    category: "Entrées",
    name: "Œuf parfait, mousseline de céleri",
    description: "Œuf 63°, truffe noire râpée, copeaux de parmesan",
    priceCents: 2600,
    available: true,
  },
  {
    category: "Entrées",
    name: "Foie gras de canard mi-cuit",
    description: "Chutney de figues, brioche toastée, fleur de sel de Guérande",
    priceCents: 2800,
    available: false,
  },

  // Poissons
  {
    category: "Poissons",
    name: "Bar de ligne en croûte de sel",
    description: "Pommes ratte, beurre blanc à l'estragon",
    priceCents: 4200,
    available: true,
  },
  {
    category: "Poissons",
    name: "Sole meunière",
    description: "Beurre noisette, citron de Menton, persil plat",
    priceCents: 4800,
    available: true,
  },
  {
    category: "Poissons",
    name: "Lieu jaune en écailles de pomme de terre",
    description: "Sauce vin jaune, girolles persillées",
    priceCents: 3600,
    available: true,
  },
  {
    category: "Poissons",
    name: "Risotto carnaroli truffe noire",
    description: "Truffe melanosporum, parmesan affiné 24 mois",
    priceCents: 4400,
    available: true,
  },

  // Viandes
  {
    category: "Viandes",
    name: "Pigeon des Costières",
    description: "Cuisse confite, suprême rosé, jus corsé au genièvre",
    priceCents: 4800,
    available: true,
  },
  {
    category: "Viandes",
    name: "Selle d'agneau de l'Aveyron",
    description: "Aubergine fumée, jus court à la sarriette",
    priceCents: 4600,
    available: true,
  },
  {
    category: "Viandes",
    name: "Filet de bœuf Black Angus",
    description: "Pommes Anna, sauce bordelaise, moelle rôtie",
    priceCents: 5200,
    available: true,
  },
  {
    category: "Viandes",
    name: "Volaille de Bresse aux morilles",
    description: "Sauce vin jaune, gnocchis maison",
    priceCents: 4200,
    available: true,
  },
  {
    category: "Viandes",
    name: "Ris de veau croustillant",
    description: "Purée de pomme de terre à la truffe, jus réduit",
    priceCents: 4400,
    available: false,
  },

  // Desserts
  {
    category: "Desserts",
    name: "Soufflé Grand Marnier",
    description: "Sorbet orange sanguine, tuile dentelle",
    priceCents: 1600,
    available: true,
  },
  {
    category: "Desserts",
    name: "Paris-Brest revisité",
    description: "Praliné noisette du Piémont, croquant cacao",
    priceCents: 1400,
    available: true,
  },
  {
    category: "Desserts",
    name: "Tarte au citron de Menton",
    description: "Meringue italienne flambée, sablé breton",
    priceCents: 1400,
    available: true,
  },
  {
    category: "Desserts",
    name: "Sphère chocolat Guanaja",
    description: "Cœur coulant, glace vanille de Madagascar",
    priceCents: 1500,
    available: true,
  },
  {
    category: "Desserts",
    name: "Mille-feuille vanille bourbon",
    description: "Pâte feuilletée caramélisée, crème légère",
    priceCents: 1400,
    available: true,
  },

  // Vins
  {
    category: "Vins",
    name: "Sancerre blanc — Domaine Vacheron 2022",
    description: "Sauvignon blanc, Loire — minéral, agrumes",
    priceCents: 6800,
    available: true,
  },
  {
    category: "Vins",
    name: "Châteauneuf-du-Pape — Vieux Télégraphe 2020",
    description: "Grenache, Syrah, Mourvèdre — ample, épicé",
    priceCents: 9800,
    available: true,
  },
  {
    category: "Vins",
    name: "Champagne Larmandier-Bernier — Latitude",
    description: "Blanc de blancs extra-brut — tendu, salin",
    priceCents: 8400,
    available: true,
  },
];
