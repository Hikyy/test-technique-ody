import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";

const KPIS = [
  { label: "Couverts ce soir", value: "84", delta: "+12 %", up: true },
  { label: "CA estimé", value: "4 280 €", delta: "+8 %", up: true },
  { label: "Panier moyen", value: "51 €", delta: "+3 %", up: true },
  { label: "Annulations", value: "2,4 %", delta: "-0,6 pt", up: false },
] as const;

const ORDERS = [
  { table: "Table 12", total: "62 €", status: "En cuisine", tone: "warn" as const, time: "20:14" },
  { table: "Table 7", total: "118 €", status: "Servie", tone: "pos" as const, time: "20:08" },
  { table: "Table 21", total: "44 €", status: "Reçue", tone: "ink" as const, time: "20:01" },
];

// Pre-computed sparkline path — calm rising curve.
const SPARK_PATH = "M 0 38 C 18 36, 28 32, 44 30 S 72 24, 90 22 S 122 18, 140 14 S 176 12, 196 8 S 228 6, 248 4";

export function HeroMockup() {
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden rounded-card border border-line bg-surface shadow-[0_1px_0_rgba(20,20,18,0.04),0_24px_60px_-24px_rgba(20,20,18,0.18)]"
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-mid" />
          <span className="size-2.5 rounded-full bg-line" />
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          <Clock className="size-3" />
          <span>Service · 20:14</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="grid size-[20px] place-items-center rounded-[5px] bg-ink pb-px font-serif text-[13px] italic leading-none text-bg"
            aria-hidden
          >
            S
          </span>
          <span className="font-serif text-[13px] italic">Sève</span>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[1.4fr_1fr] md:p-6">
        {/* Left: KPI grid + sparkline */}
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className="rounded-[10px] border border-line bg-bg p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">{kpi.label}</div>
                <div className="mt-2 font-serif text-[22px] italic leading-none">{kpi.value}</div>
                <div
                  className={["mt-2 inline-flex items-center gap-1 text-[11px]", kpi.up ? "text-pos" : "text-neg"].join(
                    " ",
                  )}
                >
                  {kpi.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {kpi.delta}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[10px] border border-line bg-bg p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                  Tendance · 7 derniers services
                </div>
                <div className="mt-1.5 font-serif text-[18px] italic leading-none">+18 % de couverts</div>
              </div>
              <div className="font-mono text-[10px] text-ink-3">SAM. → VEN.</div>
            </div>
            <svg viewBox="0 0 250 44" className="mt-3 h-12 w-full text-accent" role="img" aria-label="Tendance">
              <defs>
                <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${SPARK_PATH} L 250 44 L 0 44 Z`} fill="url(#spark-fill)" stroke="none" />
              <path d={SPARK_PATH} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Right: recent orders */}
        <div className="rounded-[10px] border border-line bg-bg p-4">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Commandes en cours</div>
            <div className="font-mono text-[10px] text-ink-3">3</div>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {ORDERS.map((o) => (
              <li key={o.table} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-serif text-[15px] italic leading-tight">{o.table}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">{o.time}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                      o.tone === "pos" && "bg-accent-soft text-pos",
                      o.tone === "warn" && "bg-warn-soft text-warn",
                      o.tone === "ink" && "bg-line text-ink-2",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {o.status}
                  </span>
                  <span className="font-mono text-[12px] text-ink">{o.total}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
