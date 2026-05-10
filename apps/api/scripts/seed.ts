import "dotenv/config";
import { closeDb, db } from "@ody/db/client";
import {
  categories as categoriesTable,
  customers as customersTable,
  dishes as dishesTable,
  notifications as notificationsTable,
  type OrderStatus,
  orderLines,
  organizationMembers,
  organizations as organizationsTable,
  orders as ordersTable,
  reservations as reservationsTable,
  restaurantMembers,
  restaurantTables as restaurantTablesTable,
  restaurants as restaurantsTable,
} from "@ody/db/schema";
import {
  SEED_CATEGORIES,
  SEED_CUSTOMERS,
  SEED_DISHES,
  SEED_NOTIFICATIONS,
  SEED_OPENING_HOURS_CANONICAL,
} from "@ody/db/seed-data";
import { eq, sql } from "drizzle-orm";
import { auth } from "../src/auth/auth.js";
import { provisioningContext } from "../src/auth/provisioning.js";

/**
 * Data model
 *   organizations  ─┬─ restaurants     (per-restaurant: orders, hours, notifications)
 *                   ├─ categories      (shared across the org's restaurants)
 *                   ├─ dishes          (shared)
 *                   └─ customers       (shared — KPIs aggregate over all restaurants)
 *
 * Rule: one user = at most one organization as `owner`. May be `admin` / `member`
 * in other organizations they're invited to.
 */

const PRIMARY_USER = {
  email: "chef@seve.fr",
  password: "seve1234",
  name: "Léa Martin",
  role: "owner",
} as const;

const EXTRA_USERS = [
  { email: "marie@bistrot.fr", password: "seve1234", name: "Marie Dubois", role: "owner" },
  { email: "jean@cafesoleil.fr", password: "seve1234", name: "Jean Castel", role: "owner" },
  { email: "thomas@seve.fr", password: "seve1234", name: "Thomas Riviere", role: "manager" },
  { email: "sophie@seve.fr", password: "seve1234", name: "Sophie Leroy", role: "staff" },
] as const;

type Restaurant = { name: string; address: string; phone: string };

type Org = {
  name: string;
  ownerEmail: string;
  restaurants: Restaurant[];
};

const ORGS: Org[] = [
  {
    name: "Sève Group",
    ownerEmail: PRIMARY_USER.email,
    restaurants: [
      { name: "Sève Paris", address: "14 rue Cambon, 75001 Paris", phone: "+33 1 42 60 18 22" },
      { name: "Sève Lyon", address: "14 quai Joffre, 69002 Lyon", phone: "+33 4 78 00 00 00" },
      { name: "Sève Bordeaux", address: "8 place du Parlement, 33000 Bordeaux", phone: "+33 5 56 00 00 00" },
    ],
  },
  {
    name: "Bistrot Lumière",
    ownerEmail: "marie@bistrot.fr",
    restaurants: [
      { name: "Lumière République", address: "32 av. de la République, 75011 Paris", phone: "+33 1 47 00 12 00" },
      { name: "Lumière Marais", address: "5 rue des Archives, 75004 Paris", phone: "+33 1 42 78 00 00" },
    ],
  },
  {
    name: "Café Soleil",
    ownerEmail: "jean@cafesoleil.fr",
    restaurants: [{ name: "Café Soleil Marseille", address: "12 Quai du Port, 13002 Marseille", phone: "+33 4 91 00 00 00" }],
  },
];

const FIRST_NAMES = [
  "Adrien", "Agathe", "Alban", "Alice", "Amaury", "Ambre", "Anaïs", "Antoine", "Arthur", "Astrid",
  "Aurélien", "Baptiste", "Béatrice", "Benjamin", "Camille", "Caroline", "Cécile", "Charles", "Charlotte",
  "Clément", "Constance", "Damien", "Diane", "Élise", "Émilie", "Étienne", "Fanny", "Florent", "Gabriel",
  "Gaëlle", "Geoffroy", "Hélène", "Hugo", "Inès", "Jeanne", "Joséphine", "Julien", "Justine", "Laetitia",
  "Laurent", "Léa", "Léon", "Louise", "Lucas", "Manon", "Margaux", "Marius", "Mathias", "Maxime", "Noémie",
  "Olivia", "Paul", "Pauline", "Quentin", "Raphaël", "Rémi", "Rose", "Salomé", "Sébastien", "Sidonie", "Simon",
  "Sophie", "Stéphane", "Thaïs", "Théo", "Timothée", "Vincent", "Zoé",
];

const LAST_NAMES = [
  "Albertini", "Beaumont", "Berthier", "Bouchard", "Caron", "Charpentier", "Chevalier", "Cohen-Sabban",
  "Daubigny", "Delacroix", "Demaret", "Dorian", "Dussart", "Esposito", "Faure", "Fontaine", "Granger",
  "Hubert", "Jourdain", "Lafaye", "Laporte", "Lefèvre", "Lemoine", "Lhermitte", "Marchetti", "Martel",
  "Moutarde", "Nakamura", "Pasquier", "Perrin", "Pommier", "Rambert", "Reverdin", "Saint-Clair", "Tessier",
  "Vasseur", "Vauthier", "Vidal", "Villiers", "Weber",
];

const CUSTOMER_NOTES = [
  "Allergie aux fruits à coque", "Préfère la table 4", "Sans gluten", "Végétarien",
  "Anniversaire en mars", "Habitué du déjeuner d'affaires", "Amateur de vins nature",
  "Réserve souvent à la dernière minute", "Sommelière confirmée", "Toujours avec son chien",
  "Critique gastronomique", null, null, null,
];

const ORDER_NOTES = [
  "Allergie aux fruits à coque", "Sans oignon", "Cuisson saignante", "Pas trop salé",
  "Avec une bougie pour anniversaire", "Service rapide demandé", null, null, null, null,
];

const STATUS_DISTRIBUTION: ReadonlyArray<OrderStatus> = [
  "pending", "pending", "pending", "pending",
  "cooking", "cooking", "cooking", "cooking",
  "sent", "sent", "sent", "sent",
  "served", "served", "served", "served", "served", "served", "served", "served", "served", "served",
  "served", "served", "served", "served", "served", "served", "served", "served",
  "cancelled", "cancelled",
];

const ORDERS_PER_RESTAURANT = 80;
const CUSTOMERS_GENERATED_PER_ORG = 60;

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260510);
const pick = <T>(arr: ReadonlyArray<T>): T => arr[Math.floor(rand() * arr.length)] as T;
const randInt = (min: number, max: number): number => Math.floor(rand() * (max - min + 1)) + min;

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function truncateAll(): Promise<void> {
  await db.execute(sql`
    TRUNCATE TABLE
      order_lines, orders, reservations, restaurant_tables,
      dishes, categories, customers,
      notifications, invitations,
      organization_members, restaurant_members,
      restaurants, organizations,
      sessions, accounts, verifications, users
    RESTART IDENTITY CASCADE
  `);
}

async function signUp(email: string, password: string, name: string, role: string): Promise<string> {
  return await provisioningContext.run({ skipAutoRestaurant: true }, async () => {
    await auth.api.signUpEmail({ body: { email, password, name } });
    const res = await db.execute<{ id: string }>(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
    const user = (res.rows ?? [])[0];
    if (!user) throw new Error(`Could not find user ${email} after signUp`);
    if (role !== "staff") {
      await db.execute(sql`UPDATE users SET role = ${role} WHERE id = ${user.id}`);
    }
    return user.id;
  });
}

async function createOrganization(name: string, ownerId: string): Promise<string> {
  return await db.transaction(async (tx) => {
    const [org] = await tx.insert(organizationsTable).values({ name }).returning({ id: organizationsTable.id });
    if (!org) throw new Error(`Failed to insert organization ${name}`);
    await tx.insert(organizationMembers).values({ organizationId: org.id, userId: ownerId, role: "owner" });
    return org.id;
  });
}

async function addOrgMember(organizationId: string, userId: string, role: "owner" | "admin" | "member"): Promise<void> {
  await db
    .insert(organizationMembers)
    .values({ organizationId, userId, role })
    .onConflictDoNothing({ target: [organizationMembers.organizationId, organizationMembers.userId] });
}

async function createRestaurant(organizationId: string, ownerId: string, r: Restaurant): Promise<string> {
  return await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(restaurantsTable)
      .values({
        organizationId,
        name: r.name,
        address: r.address,
        phone: r.phone,
        currency: "EUR",
        openingHoursJson: SEED_OPENING_HOURS_CANONICAL as never,
        notificationsJson: SEED_NOTIFICATIONS,
        onboardedAt: new Date(),
      })
      .returning({ id: restaurantsTable.id });
    if (!row) throw new Error(`Failed to insert restaurant ${r.name}`);
    await tx.insert(restaurantMembers).values({ restaurantId: row.id, userId: ownerId, role: "owner" });
    return row.id;
  });
}

async function addRestaurantMember(restaurantId: string, userId: string, role: "owner" | "manager" | "staff"): Promise<void> {
  await db
    .insert(restaurantMembers)
    .values({ restaurantId, userId, role })
    .onConflictDoNothing({ target: [restaurantMembers.restaurantId, restaurantMembers.userId] });
}

async function seedRestaurantCatalog(restaurantId: string): Promise<{
  dishes: Array<{ id: string; priceCents: number }>;
}> {
  const cats = await db
    .insert(categoriesTable)
    .values(SEED_CATEGORIES.map((c) => ({ restaurantId, name: c.name, position: c.position })))
    .returning({ id: categoriesTable.id, name: categoriesTable.name });
  const catByName = new Map(cats.map((c) => [c.name, c.id]));

  const dishRows = SEED_DISHES.map((d) => {
    const categoryId = catByName.get(d.category);
    if (!categoryId) throw new Error(`Unknown category: ${d.category}`);
    return {
      restaurantId,
      categoryId,
      name: d.name,
      description: d.description,
      priceCents: d.priceCents,
      available: d.available,
    };
  });
  const dishes = await db
    .insert(dishesTable)
    .values(dishRows)
    .returning({ id: dishesTable.id, priceCents: dishesTable.priceCents });

  return { dishes };
}

async function seedOrgCustomers(organizationId: string, orgSlug: string): Promise<string[]> {
  const curated = SEED_CUSTOMERS.map((c) => ({
    organizationId,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email ? c.email.replace("@", `+${orgSlug}@`) : null,
    phone: c.phone ?? null,
    notes: c.notes ?? null,
    visitsCount: c.visitsCount,
    spentCents: c.spentCents,
  }));

  const generated = Array.from({ length: CUSTOMERS_GENERATED_PER_ORG }, () => {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const note = pick(CUSTOMER_NOTES);
    const visitsCount = randInt(0, 40);
    return {
      organizationId,
      firstName,
      lastName,
      email:
        rand() < 0.65 ? `${slugify(firstName)}.${slugify(lastName)}+${orgSlug}@example.com` : null,
      phone: rand() < 0.85 ? `06 ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}` : null,
      notes: note ?? null,
      visitsCount,
      spentCents: visitsCount * randInt(2400, 11000),
    };
  });

  const rows = await db
    .insert(customersTable)
    .values([...curated, ...generated])
    .returning({ id: customersTable.id });
  return rows.map((r) => r.id);
}

async function seedRestaurantTables(restaurantId: string): Promise<Array<{ id: string; capacity: number }>> {
  const TABLES = [
    { label: "T1", capacity: 2 },
    { label: "T2", capacity: 2 },
    { label: "T3", capacity: 4 },
    { label: "T4", capacity: 4 },
    { label: "T5", capacity: 4 },
    { label: "T6", capacity: 6 },
    { label: "T7", capacity: 8 },
    { label: "Bar 1", capacity: 2 },
    { label: "Bar 2", capacity: 2 },
    { label: "Terrasse 1", capacity: 4 },
    { label: "Terrasse 2", capacity: 6 },
  ];
  const rows = await db
    .insert(restaurantTablesTable)
    .values(TABLES.map((t, i) => ({ restaurantId, label: t.label, capacity: t.capacity, position: i })))
    .returning({ id: restaurantTablesTable.id, capacity: restaurantTablesTable.capacity });
  return rows;
}

const RESERVATION_STATUS_DIST = [
  "confirmed", "confirmed", "confirmed", "confirmed", "confirmed",
  "pending", "pending",
  "seated",
  "completed", "completed", "completed",
  "cancelled",
  "no_show",
] as const;

async function seedRestaurantReservations(
  restaurantId: string,
  tables: Array<{ id: string; capacity: number }>,
  customerIds: string[],
): Promise<number> {
  if (tables.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // For each day in [today-3, today+10], generate ~6 reservations distributed across tables
  // and lunch/dinner services. Skip slot conflicts (the EXCLUDE constraint will reject anyway).
  let total = 0;
  for (let d = -3; d <= 10; d++) {
    const day = new Date(today);
    day.setDate(today.getDate() + d);
    const slotsPerService = [
      { hour: 12, count: 3 },
      { hour: 13, count: 2 },
      { hour: 19, count: 2 },
      { hour: 20, count: 3 },
      { hour: 21, count: 2 },
    ];
    for (const slot of slotsPerService) {
      for (let i = 0; i < slot.count; i++) {
        const tbl = pick(tables);
        const partySize = randInt(1, tbl.capacity);
        const startsAt = new Date(day);
        startsAt.setHours(slot.hour, randInt(0, 1) * 30, 0, 0);
        const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
        const status = d < 0 ? (rand() < 0.85 ? "completed" : "no_show") : pick(RESERVATION_STATUS_DIST);
        const useCustomer = rand() < 0.6 && customerIds.length > 0;
        try {
          await db.insert(reservationsTable).values({
            restaurantId,
            tableId: tbl.id,
            customerId: useCustomer ? pick(customerIds) : null,
            guestName: useCustomer ? null : `${pick(["M.", "Mme"])} ${pick(["Albert", "Beauchamp", "Cazals", "Doré", "Esnault", "Faure", "Garcia", "Henry"])}`,
            guestPhone: rand() < 0.7 ? `06 ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}` : null,
            partySize,
            startsAt,
            endsAt,
            status,
            notes: rand() < 0.18 ? pick(["Allergie noix", "Anniversaire", "Près de la fenêtre"]) : null,
          });
          total++;
        } catch {
          // overlap or other constraint → skip silently for seed
        }
      }
    }
  }
  return total;
}

async function seedRestaurantOrders(
  restaurantId: string,
  dishes: Array<{ id: string; priceCents: number }>,
  customerIds: string[],
): Promise<number> {
  const now = Date.now();
  let total = 0;

  await db.transaction(async (tx) => {
    for (let i = 0; i < ORDERS_PER_RESTAURANT; i++) {
      const status = pick(STATUS_DISTRIBUTION);
      const lineCount = randInt(1, 5);
      const used = new Set<string>();
      const lines: Array<{ dishId: string; qty: number; unitPriceCents: number }> = [];
      for (let j = 0; j < lineCount; j++) {
        let d = pick(dishes);
        let attempts = 0;
        while (used.has(d.id) && attempts < 8) {
          d = pick(dishes);
          attempts++;
        }
        used.add(d.id);
        lines.push({ dishId: d.id, qty: randInt(1, 3), unitPriceCents: d.priceCents });
      }
      const totalCents = lines.reduce((acc, l) => acc + l.qty * l.unitPriceCents, 0);
      const minutesAgo = randInt(5, 60 * 24 * 30);
      const scheduledAt = new Date(now - minutesAgo * 60_000);
      const customerId = rand() < 0.78 && customerIds.length > 0 ? pick(customerIds) : null;

      const [order] = await tx
        .insert(ordersTable)
        .values({
          restaurantId,
          tableNumber: randInt(1, 30),
          status,
          customerId,
          scheduledAt,
          totalCents,
          notes: pick(ORDER_NOTES),
        })
        .returning({ id: ordersTable.id });
      if (!order) throw new Error("Failed to insert order");

      await tx.insert(orderLines).values(
        lines.map((l) => ({ orderId: order.id, dishId: l.dishId, qty: l.qty, unitPriceCents: l.unitPriceCents })),
      );
      total++;
    }
  });

  return total;
}

async function seedRestaurantNotifications(restaurantId: string): Promise<number> {
  const now = Date.now();
  const items: Array<typeof notificationsTable.$inferInsert> = [];
  for (let i = 0; i < 12; i++) {
    const unread = i < 4;
    const minutesAgo = unread ? randInt(2, 180) : randInt(180, 60 * 24 * 5);
    const types: Array<{ type: string; title: string; data: Record<string, unknown> }> = [
      { type: "order.created", title: `Nouvelle commande · table ${randInt(1, 24)}`, data: { tableNumber: randInt(1, 24) } },
      { type: "order.status_changed", title: "Statut · En cuisine → Envoyée", data: { from: "cooking", to: "sent" } },
      { type: "order.cancelled", title: `Commande annulée · table ${randInt(1, 24)}`, data: { from: "pending", to: "cancelled" } },
      { type: "system", title: "Rapport quotidien disponible", data: {} },
    ];
    const t = pick(types);
    items.push({
      restaurantId,
      type: t.type,
      title: t.title,
      data: t.data,
      readAt: unread ? null : new Date(now - (minutesAgo - 60) * 60_000),
      createdAt: new Date(now - minutesAgo * 60_000),
    });
  }
  await db.insert(notificationsTable).values(items);
  return items.length;
}

async function finalizeRestaurant(restaurantId: string, r: Restaurant): Promise<void> {
  await db
    .update(restaurantsTable)
    .set({ name: r.name, address: r.address, phone: r.phone, onboardedAt: new Date() })
    .where(eq(restaurantsTable.id, restaurantId));
}

async function main(): Promise<void> {
  console.log("🌱 Seeding Sève (multi-org · org-shared catalog & customers)...");
  await truncateAll();
  console.log("  ✓ truncated");

  const userByEmail = new Map<string, string>();
  userByEmail.set(
    PRIMARY_USER.email,
    await signUp(PRIMARY_USER.email, PRIMARY_USER.password, PRIMARY_USER.name, PRIMARY_USER.role),
  );
  for (const u of EXTRA_USERS) {
    userByEmail.set(u.email, await signUp(u.email, u.password, u.name, u.role));
  }
  console.log(`  ✓ ${userByEmail.size} users`);

  let totalRestaurants = 0;
  let totalDishes = 0;
  let totalCustomers = 0;
  let totalOrders = 0;
  let totalNotifications = 0;
  let totalTables = 0;
  let totalReservations = 0;

  for (const org of ORGS) {
    const ownerId = userByEmail.get(org.ownerEmail);
    if (!ownerId) throw new Error(`Owner not found: ${org.ownerEmail}`);

    const orgId = await createOrganization(org.name, ownerId);

    if (org.name === "Sève Group") {
      const thomas = userByEmail.get("thomas@seve.fr");
      const sophie = userByEmail.get("sophie@seve.fr");
      const marie = userByEmail.get("marie@bistrot.fr");
      if (thomas) await addOrgMember(orgId, thomas, "admin");
      if (sophie) await addOrgMember(orgId, sophie, "member");
      if (marie) await addOrgMember(orgId, marie, "admin");
    }
    if (org.name === "Bistrot Lumière") {
      const lea = userByEmail.get(PRIMARY_USER.email);
      if (lea) await addOrgMember(orgId, lea, "admin");
    }

    // Org-level: customers shared across all restaurants of this org (KPIs aggregation).
    const customerIds = await seedOrgCustomers(orgId, slugify(org.name));
    totalCustomers += customerIds.length;

    // Restaurant-level: own catalog (categories+dishes), opening hours, tables, reservations, orders, notifications.
    for (const r of org.restaurants) {
      const restaurantId = await createRestaurant(orgId, ownerId, r);
      await finalizeRestaurant(restaurantId, r);

      if (org.name === "Sève Group") {
        const thomas = userByEmail.get("thomas@seve.fr");
        const sophie = userByEmail.get("sophie@seve.fr");
        if (thomas) await addRestaurantMember(restaurantId, thomas, "manager");
        if (sophie) await addRestaurantMember(restaurantId, sophie, "staff");
      }

      const { dishes } = await seedRestaurantCatalog(restaurantId);
      const tables = await seedRestaurantTables(restaurantId);
      const reservationCount = await seedRestaurantReservations(restaurantId, tables, customerIds);
      const orderCount = await seedRestaurantOrders(restaurantId, dishes, customerIds);
      const notifCount = await seedRestaurantNotifications(restaurantId);
      totalDishes += dishes.length;
      totalRestaurants++;
      totalOrders += orderCount;
      totalNotifications += notifCount;
      totalTables += tables.length;
      totalReservations += reservationCount;

      console.log(
        `  ✓ ${org.name} / ${r.name} — ${dishes.length} dishes, ${tables.length} tables, ${reservationCount} resa, ${orderCount} orders, ${notifCount} notifs`,
      );
    }

    console.log(`    └─ ${org.name}: ${customerIds.length} customers (org-shared)`);
  }

  console.log("");
  console.log("✅ Seed complete.");
  console.log(`   organizations:  ${ORGS.length}`);
  console.log(`   restaurants:    ${totalRestaurants}`);
  console.log(`   dishes:         ${totalDishes}  (per-restaurant)`);
  console.log(`   customers:      ${totalCustomers}  (org-shared)`);
  console.log(`   tables:         ${totalTables}  (per-restaurant)`);
  console.log(`   reservations:   ${totalReservations}  (per-restaurant)`);
  console.log(`   orders:         ${totalOrders}  (per-restaurant)`);
  console.log(`   notifications:  ${totalNotifications}  (per-restaurant)`);
  console.log("");
  console.log("Logins (password: seve1234):");
  console.log(`   ${PRIMARY_USER.email.padEnd(22)} — Léa Martin (owner Sève Group + admin Bistrot Lumière)`);
  for (const u of EXTRA_USERS) console.log(`   ${u.email.padEnd(22)} — ${u.name}`);
}

main()
  .catch((err: unknown) => {
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
