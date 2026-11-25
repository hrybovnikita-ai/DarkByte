import type { Company } from "@prisma/client";
import type { CompanyCatalogItem } from "@/data/companies-catalog";

export function mapCompanyToCatalog(row: Company): CompanyCatalogItem {
  const palette = row.accentPalette;
  const accentPalette = Array.isArray(palette)
    ? (palette as string[])
    : typeof palette === "string"
      ? JSON.parse(palette) as string[]
      : [];

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    website: row.website,
    description: row.description,
    category: row.category,
    accentColor: row.accentColor,
    accentPalette,
    integrationStatus: "INSPIRATION_ONLY",
  };
}