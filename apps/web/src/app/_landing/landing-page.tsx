import {
  Activity,
  Building2,
  Check,
  ChefHat,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { HeroMockup } from "./hero-mockup";
import { LandingHeader } from "./landing-header";

const FEATURES = [
  {
    icon: Activity,
    title: "Service en temps réel",
    body: "Tableau de service vivant : commandes, tables, retards et envois en cuisine, sans rafraîchir la page.",
  },
  {
    icon: Utensils,
    title: "Carte vivante",
    body: "Plats du jour, ruptures et suggestions, à jour en cuisine et en salle. Une seule source, jamais d'oubli.",
  },
  {
    icon: UsersRound,
    title: "Fiche client mémorisée",
    body: "Allergies, préférences, dernières visites. La table 7 retrouve son verre habituel sans le demander.",
  },
  {
    icon: Building2,
    title: "Multi-établissements",
    body: "Pilotez plusieurs adresses depuis un seul compte. Chiffres consolidés, équipes distinctes.",
  },
  {
    icon: ChefHat,
    title: "Équipe coordonnée",
    body: "Rôles, plannings et messages internes. La salle, la cuisine et le passe parlent la même langue.",
  },
  {
    icon: ShieldCheck,
    title: "Données souveraines",
    body: "Hébergement européen, exports libres, sauvegardes quotidiennes. Vos données restent les vôtres.",
  },
] as const;

const STEPS = [
  {
    title: "Le matin, la mise en place",
    body: "Vérifiez les réservations du soir, marquez les ruptures, ajoutez les suggestions. Sève prépare la salle.",
  },
  {
    title: "Au coup de feu",
    body: "Les commandes glissent du PDA au passe. Les retards se voient, les priorités aussi. Personne ne crie.",
  },
  {
    title: "Au moment du café",
    body: "Les fiches clients se mettent à jour. La table 12 fête un anniversaire — vous le saurez la prochaine fois.",
  },
  {
    title: "Après le service",
    body: "Caisse, marges, panier moyen, pourboires. Le service est clos en deux clics, le rapport part par e-mail.",
  },
] as const;

const PLANS = [
  {
    name: "Service",
    price: "49 €",
    suffix: "/ mois",
    description: "Pour un établissement, jusqu'à 60 couverts par service.",
    features: [
      "Tableau de service en direct",
      "Carte et fiches plats illimitées",
      "Fiches client et historique",
      "Rapports de fin de service",
      "Assistance par e-mail",
    ],
    cta: "Commencer avec Service",
    highlight: false,
  },
  {
    name: "Brigade",
    price: "119 €",
    suffix: "/ mois",
    description: "Pour les maisons exigeantes ou plusieurs adresses.",
    features: [
      "Tout ce qu'il y a dans Service",
      "Multi-établissements consolidés",
      "Rôles et permissions étendus",
      "Exports comptables avancés",
      "Accompagnement dédié",
    ],
    cta: "Choisir Brigade",
    highlight: true,
  },
] as const;

const FAQS = [
  {
    q: "Faut-il du matériel particulier ?",
    a: "Non. Sève fonctionne sur tout navigateur récent : ordinateur en caisse, tablette en salle, téléphone en cuisine. Aucun logiciel à installer.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Hébergement en France, chiffrement au repos et en transit, sauvegardes quotidiennes. Vous pouvez exporter ou supprimer vos données à tout moment.",
  },
  {
    q: "Puis-je essayer avant de m'engager ?",
    a: "Oui. Les 14 premiers jours sont offerts, sans carte bancaire. Vous gardez vos données si vous décidez de continuer.",
  },
  {
    q: "Et si je change d'avis ?",
    a: "Aucun engagement. Vous arrêtez quand vous voulez, depuis votre espace. Nous fournissons un export complet de vos données.",
  },
  {
    q: "Sève remplace-t-il ma caisse ?",
    a: "Sève s'intègre à la plupart des caisses du marché ou peut faire office de caisse simple. Nous étudions chaque configuration avec vous.",
  },
] as const;

const TRUSTED_BY = [
  "Maison Verlaine",
  "L'Été Indien",
  "Café Ronsard",
  "Bistrot des Cinq Sens",
  "La Table d'Élise",
  "Auberge du Tilleul",
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <LandingHeader />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <Workflow />
        <Testimonial />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft radial accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-160px] mx-auto h-[420px] max-w-[900px] rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, rgba(91,110,79,0.18) 0%, rgba(91,110,79,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-6 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[820px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-2 backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Service du soir
          </div>

          <h1 className="mt-6 font-serif text-[44px] italic leading-[1.04] tracking-tight text-ink sm:text-[58px] md:text-[76px] lg:text-[88px]">
            L'exploitation de votre restaurant,
            <br />
            <span className="text-accent">simplifiée.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[620px] text-[15px] leading-relaxed text-ink-2 md:text-[17px]">
            Sève réunit le service, la carte, les clients et les équipes en un seul outil pensé pour les maisons
            françaises. Un tableau de bord calme, fiable, et fait pour durer.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-ink px-6 text-[14px] font-medium text-bg shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Démarrer gratuitement
            </Link>
            <a
              href="#demo"
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-line-mid bg-surface px-6 text-[14px] text-ink transition-colors hover:bg-accent-soft hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Voir une démo
            </a>
          </div>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            Sans carte bancaire · Mise en place en 5 minutes
          </p>
        </div>

        <div id="demo" className="relative mx-auto mt-14 max-w-[1080px] md:mt-20">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="border-y border-line bg-bg">
      <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
        <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-3">
          Ils nous font confiance
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TRUSTED_BY.map((name) => (
            <li
              key={name}
              className="font-serif text-[16px] uppercase italic tracking-[0.18em] text-ink-3 md:text-[17px]"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-[680px]">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">Fonctionnalités</p>
          <h2 className="mt-3 font-serif text-[36px] italic leading-[1.08] text-ink md:text-[52px]">
            Tout ce qu'il faut, rien de plus.
          </h2>
          <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-ink-2">
            Six outils essentiels, dessinés ensemble pour que le service avance, sans friction et sans bruit.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.title} className="bg-surface p-7 transition-colors hover:bg-bg">
                <div className="grid size-10 place-items-center rounded-[8px] bg-accent-soft text-accent">
                  <Icon className="size-[18px]" />
                </div>
                <h3 className="mt-5 font-serif text-[22px] italic leading-tight text-ink">{f.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">{f.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-16">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
              Le service comme il devrait être
            </p>
            <h2 className="mt-3 font-serif text-[34px] italic leading-[1.08] text-ink md:text-[48px]">
              Une journée, sans heurts.
            </h2>

            <ol className="mt-12 space-y-10">
              {STEPS.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[auto_1fr] gap-6">
                  <div className="font-mono text-[12px] tracking-[0.12em] text-ink-3">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-serif text-[24px] italic leading-tight text-ink">{step.title}</h3>
                    <p className="mt-2 max-w-[480px] text-[14.5px] leading-relaxed text-ink-2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="relative">
            <div className="sticky top-28 rounded-card border border-line bg-bg p-8">
              <div className="grid size-10 place-items-center rounded-[8px] bg-accent-soft text-accent">
                <Sparkles className="size-[18px]" />
              </div>
              <p className="mt-6 font-serif text-[26px] italic leading-snug text-ink">
                « Le bon outil, c'est celui qu'on oublie pendant le service. »
              </p>
              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                — Principe de conception
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Disponibilité</dt>
                  <dd className="mt-1.5 font-serif text-[22px] italic">99,98 %</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Hébergement</dt>
                  <dd className="mt-1.5 font-serif text-[22px] italic">France</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section id="testimonial" className="scroll-mt-24 border-t border-line">
      <div className="mx-auto max-w-[1000px] px-6 py-20 text-center md:px-10 md:py-28">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">Témoignage</p>
        <blockquote className="mt-8">
          <p className="font-serif text-[30px] italic leading-[1.18] text-ink md:text-[44px]">
            « On a retrouvé du calme en salle. Les fiches clients, les ruptures, les rapports — tout est là sans qu'on y
            pense. C'est devenu invisible, et c'est précisément ce qu'on cherchait. »
          </p>
        </blockquote>
        <div className="mt-10 inline-flex flex-col items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
          <span className="text-ink-2">Camille Verlaine</span>
          <span>Cheffe — Maison Verlaine, Lyon · 1 étoile</span>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">Tarifs</p>
          <h2 className="mt-3 font-serif text-[36px] italic leading-[1.08] text-ink md:text-[52px]">
            Une formule par maison.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
            Sans engagement. 14 jours offerts. Vous changez de formule quand vous voulez.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-[920px] grid-cols-1 gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={[
                "relative flex flex-col rounded-card border bg-surface p-8",
                plan.highlight
                  ? "border-ink shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(20,20,18,0.18)]"
                  : "border-line",
              ].join(" ")}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-bg">
                  Recommandée
                </span>
              ) : null}
              <h3 className="font-serif text-[28px] italic text-ink">{plan.name}</h3>
              <p className="mt-2 text-[13.5px] text-ink-2">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-serif text-[48px] italic leading-none text-ink">{plan.price}</span>
                <span className="text-[13px] text-ink-2">{plan.suffix}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3.5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-[14px] text-ink">
                    <span className="mt-0.5 grid size-[18px] place-items-center rounded-full bg-accent-soft text-accent">
                      <Check className="size-[12px]" strokeWidth={2.5} />
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={[
                  "mt-10 inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  plan.highlight
                    ? "bg-ink text-bg hover:bg-ink/90"
                    : "border border-line-mid bg-surface text-ink hover:bg-accent-soft hover:border-line-strong",
                ].join(" ")}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[860px] px-6 py-20 md:px-10 md:py-28">
        <div className="text-center">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">Questions fréquentes</p>
          <h2 className="mt-3 font-serif text-[34px] italic leading-[1.1] text-ink md:text-[44px]">
            Vous vous demandiez peut-être…
          </h2>
        </div>
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {FAQS.map((item) => (
            <li key={item.q}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-serif text-[20px] italic text-ink marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:text-[22px]">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-6 pr-10 text-[14.5px] leading-relaxed text-ink-2">{item.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-line bg-ink text-bg">
      <div className="mx-auto max-w-[1200px] px-6 py-24 text-center md:px-10 md:py-32">
        <h2 className="mx-auto max-w-[760px] font-serif text-[40px] italic leading-[1.06] md:text-[64px]">
          Reprenez la main sur votre service.
        </h2>
        <p className="mx-auto mt-6 max-w-[520px] text-[15px] leading-relaxed text-bg/70 md:text-[17px]">
          14 jours offerts. Aucune carte bancaire demandée. Mise en place en moins de cinq minutes.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-bg px-6 text-[14px] font-medium text-ink transition-colors hover:bg-bg/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-bg/20 px-6 text-[14px] text-bg transition-colors hover:bg-bg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            J'ai déjà un compte
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const COLS: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Produit",
      links: [
        { label: "Fonctionnalités", href: "#features" },
        { label: "Tarifs", href: "#pricing" },
        { label: "Témoignages", href: "#testimonial" },
      ],
    },
    {
      title: "Entreprise",
      links: [
        { label: "À propos", href: "#" },
        { label: "Journal", href: "#" },
        { label: "Contact", href: "mailto:bonjour@seve.fr" },
      ],
    },
    {
      title: "Légal",
      links: [
        { label: "Mentions légales", href: "#" },
        { label: "Confidentialité", href: "#" },
        { label: "CGU", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid size-[26px] place-items-center rounded-[6px] bg-ink pb-0.5 font-serif text-[18px] italic leading-none text-bg"
              >
                S
              </span>
              <span className="font-serif text-[19px] italic">Sève</span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-ink-2">
              Le tableau de bord de service pour les restaurateurs français. Calme, fiable, fait pour durer.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[13px] text-ink-2 transition-colors hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 md:flex-row md:items-center">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
            © {CURRENT_YEAR} Sève. Conçu en France.
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">bonjour@seve.fr</p>
        </div>
      </div>
    </footer>
  );
}
