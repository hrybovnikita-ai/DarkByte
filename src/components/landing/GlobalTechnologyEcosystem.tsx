"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { COMPANIES_CATALOG } from "@/data/companies-catalog";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

type CompanyApi = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  website: string;
  description: string;
  category: string;
  accentColor: string;
  integrationStatus: string;
};

type CompanyView = CompanyApi & { accentPalette: string[] };

function paletteForSlug(slug: string, accentColor: string): string[] {
  return (
    COMPANIES_CATALOG.find((item) => item.slug === slug)?.accentPalette ?? [
      accentColor,
    ]
  );
}

function CompanyCard({
  company,
  reveal,
  delayMs,
}: {
  company: CompanyView;
  reveal: boolean;
  delayMs: number;
}) {
  const primary = company.accentColor;
  const palette = company.accentPalette;
  const glow = `0 0 28px color-mix(in srgb, ${primary} 45%, transparent)`;

  return (
    <a
      href={company.website}
      target="_blank"
      rel="noopener noreferrer"
      className={`company-card group motion-safe:transition motion-safe:duration-500 motion-safe:hover:-translate-y-1 ${
        reveal ? "section-reveal is-visible" : "section-reveal"
      }`}
      style={
        {
          "--company-accent": primary,
          "--company-glow": glow,
          transitionDelay: reveal ? `${delayMs}ms` : "0ms",
        } as CSSProperties
      }
      aria-label={`Visit ${company.name} official website (opens in new tab)`}
    >
      <PaletteStrip
        className="pointer-events-none absolute inset-0 opacity-40"
        palette={palette}
      />
      <div className="company-card-inner relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="relative h-14 w-14 shrink-0 border border-zinc-800 bg-black p-2">
            <Image
              src={company.logo}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="border border-zinc-800 px-2 py-1 text-[10px] tracking-widest text-zinc-500">
            {company.integrationStatus.replace(/_/g, " ")}
          </span>
        </div>
        <h3 className="mt-5 text-lg font-bold text-white group-hover:text-[var(--company-accent)]">
          {company.name}
        </h3>
        <p className="mt-1 text-xs tracking-widest text-zinc-500">
          {company.category}
        </p>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-400">
          {company.description}
        </p>
        <p className="mt-4 text-xs tracking-wider text-[var(--company-accent)]">
          VISIT OFFICIAL SITE →
        </p>
      </div>
    </a>
  );
}

function MotionSafePalette({
  palette,
  className,
}: {
  palette: string[];
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <div className="flex h-full gap-0.5">
        {palette.map((color) => (
          <div
            key={color}
            className="h-full flex-1 opacity-60"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

// Fix component name for JSX - I used motion-safe-palette wrongly
function PaletteStrip(props: { palette: string[]; className?: string }) {
  return <MotionSafePalette {...props} />;
}

export default function GlobalTechnologyEcosystem() {
  const sectionRef = useRef<HTMLElement>(null);
  const [reveal, setReveal] = useState(false);
  const [companies, setCompanies] = useState<CompanyView[] | null>(null);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/companies?pageSize=20");
      const body = await response.json();
      if (!body.success) {
        setError(body.error?.message ?? "Could not load innovators.");
        setCompanies(
          COMPANIES_CATALOG.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            logo: item.logo,
            website: item.website,
            description: item.description,
            category: item.category,
            accentColor: item.accentColor,
            integrationStatus: item.integrationStatus,
            accentPalette: item.accentPalette,
          })),
        );
        return;
      }
      const rows = body.data as CompanyApi[];
      setCompanies(
        rows.map((row) => ({
          ...row,
          accentPalette: paletteForSlug(row.slug, row.accentColor),
        })),
      );
    } catch {
      setError("Network error while loading the technology catalog.");
      setCompanies(
        COMPANIES_CATALOG.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          logo: item.logo,
          website: item.website,
          description: item.description,
          category: item.category,
          accentColor: item.accentColor,
          integrationStatus: item.integrationStatus,
          accentPalette: item.accentPalette,
        })),
      );
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return;
    }
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      queueMicrotask(() => setReveal(true));
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          queueMicrotask(() => setReveal(true));
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const marqueeItems = companies ?? [];

  return (
    <section
      ref={sectionRef}
      id="global-technology-ecosystem"
      className="relative border-y border-zinc-900 bg-black px-6 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <p
          className={`mb-4 text-center tracking-[0.3em] text-[var(--db-neon-lime)] ${
            reveal ? "section-reveal is-visible" : "section-reveal"
          }`}
        >
          {"// GLOBAL TECHNOLOGY ECOSYSTEM"}
        </p>

        <h2
          className={`pixel-font text-center text-xl sm:text-3xl ${
            reveal ? "section-reveal is-visible" : "section-reveal"
          }`}
          style={{ transitionDelay: reveal ? "80ms" : "0ms" }}
        >
          INSPIRED BY GLOBAL INNOVATORS
        </h2>

        <p
          className={`mx-auto mt-6 max-w-3xl text-center text-lg text-zinc-400 ${
            reveal ? "section-reveal is-visible" : "section-reveal"
          }`}
          style={{ transitionDelay: reveal ? "120ms" : "0ms" }}
        >
          Exploring the future of technology, artificial intelligence,
          creativity and digital entertainment.
        </p>

        <p
          className={`mx-auto mt-6 max-w-4xl text-center text-base leading-relaxed text-zinc-500 ${
            reveal ? "section-reveal is-visible" : "section-reveal"
          }`}
          style={{ transitionDelay: reveal ? "160ms" : "0ms" }}
        >
          DARKBYTE brings together ideas inspired by the world&apos;s leading
          technology innovators, combining artificial intelligence, interactive
          entertainment, pixel art and modern software engineering into a unique
          digital experience.
        </p>

        {error && (
          <p className="mt-6 text-center text-sm text-amber-500">{error}</p>
        )}

        {!companies ? (
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <PixelSkeleton key={index} lines={4} />
            ))}
          </div>
        ) : (
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {companies.map((company, index) => (
              <CompanyCard
                key={company.id}
                company={company}
                reveal={reveal}
                delayMs={80 + index * 50}
              />
            ))}
          </div>
        )}

        {marqueeItems.length > 0 && (
          <div className="mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs tracking-widest text-zinc-500">
                LOGO MARQUEE // SCROLLING REFERENCE
              </p>
              <button
                type="button"
                className="border border-zinc-700 px-4 py-2 text-xs tracking-wider text-zinc-300 hover:border-zinc-500"
                aria-pressed={marqueePaused}
                onClick={() => setMarqueePaused((value) => !value)}
              >
                {marqueePaused ? "PLAY MARQUEE" : "PAUSE MARQUEE"}
              </button>
            </div>
            <div className="brand-marquee-mask overflow-hidden border border-zinc-900 bg-[#080808] py-4">
              <div
                className={`brand-marquee-track flex gap-10 ${
                  marqueePaused ? "is-paused" : ""
                }`}
              >
                {[...marqueeItems, ...marqueeItems].map((company, index) => (
                  <a
                    key={`${company.id}-${index}`}
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-3 px-2 motion-safe:transition hover:opacity-100 opacity-80"
                    style={{ color: company.accentColor }}
                  >
                    <Image
                      src={company.logo}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                    <span className="pixel-font text-xs tracking-widest">
                      {company.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="mx-auto mt-12 max-w-3xl border border-zinc-900 bg-[#0a0a0a] p-4 text-center text-xs leading-relaxed text-zinc-600">
          Independent disclaimer: All trademarks, logos and company names belong
          to their respective owners. DARKBYTE is not affiliated with, sponsored
          by, endorsed by or partnered with the companies shown. References are
          for creative inspiration only; no live product integrations are
          claimed unless explicitly stated elsewhere in the project.
        </p>
      </div>
    </section>
  );
}