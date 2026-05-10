"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#pricing", label: "Tarifs" },
  { href: "#testimonial", label: "Témoignages" },
] as const;

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-40 w-full transition-[background,backdrop-filter,border-color] duration-200",
        scrolled ? "border-b border-line bg-bg/80 backdrop-blur-md" : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Sève — accueil">
          <span
            aria-hidden
            className="grid size-[28px] place-items-center rounded-[7px] bg-ink pb-0.5 font-serif text-[19px] italic leading-none text-bg"
          >
            S
          </span>
          <span className="font-serif text-[21px] italic tracking-tight">Sève</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-ink-2 transition-colors hover:text-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-[8px] px-3 py-2 text-[13px] text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex h-[34px] items-center rounded-[8px] bg-ink px-4 text-[13px] font-medium text-bg shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Démarrer maintenant
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-9 place-items-center rounded-[8px] border border-line text-ink hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-x-0 top-16 z-30 border-t border-line bg-bg px-6 py-6 md:hidden">
          <nav aria-label="Navigation mobile" className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-serif text-[22px] italic text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-6">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line-mid text-[14px] text-ink"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink text-[14px] font-medium text-bg"
              >
                Démarrer maintenant
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
