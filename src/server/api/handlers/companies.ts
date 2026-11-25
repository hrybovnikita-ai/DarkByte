import type { Prisma } from "@prisma/client";
import { COMPANIES_CATALOG, type CompanyCatalogItem } from "@/data/companies-catalog";
import { getPrisma } from "@/lib/db";
import { apiSuccess } from "@/server/api/response";
import { parseListQuery, paginationMeta } from "@/server/api/pagination";
import { mapCompanyToCatalog } from "@/server/mappers/company";

export type CompanyPublic = Omit<CompanyCatalogItem, "accentPalette">;

function toPublic({ accentPalette: _unused, ...rest }: CompanyCatalogItem): CompanyPublic {
  void _unused;
  return rest;
}

function filterCatalog(
  search: string | undefined,
  category: string | undefined,
) {
  let items = [...COMPANIES_CATALOG];
  if (search) {
    const needle = search.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle),
    );
  }
  if (category) {
    const cat = category.toLowerCase();
    items = items.filter((item) => item.category.toLowerCase().includes(cat));
  }
  return items;
}

export async function listCompanies(request: Request) {
  const url = new URL(request.url);
  const query = parseListQuery(url.searchParams);
  const category = url.searchParams.get("category") ?? undefined;
  const prisma = getPrisma();

  if (!prisma) {
    const filtered = filterCatalog(query.search, category);
    const start = (query.page - 1) * query.pageSize;
    const slice = filtered.slice(start, start + query.pageSize);
    return apiSuccess(slice.map(toPublic), {
      meta: paginationMeta(query.page, query.pageSize, filtered.length),
    });
  }

  try {
    const where: Prisma.CompanyWhereInput = {
      status: "PUBLISHED",
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { category: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(category
        ? { category: { contains: category, mode: "insensitive" } }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    if (rows.length === 0 && total === 0 && !query.search && !category) {
      const filtered = filterCatalog(undefined, undefined);
      const start = (query.page - 1) * query.pageSize;
      const slice = filtered.slice(start, start + query.pageSize);
      return apiSuccess(slice.map(toPublic), {
        meta: paginationMeta(query.page, query.pageSize, filtered.length),
      });
    }

    const data = rows.map((row) => toPublic(mapCompanyToCatalog(row)));
    return apiSuccess(data, {
      meta: paginationMeta(query.page, query.pageSize, total),
    });
  } catch {
    const filtered = filterCatalog(query.search, category);
    const start = (query.page - 1) * query.pageSize;
    const slice = filtered.slice(start, start + query.pageSize);
    return apiSuccess(slice.map(toPublic), {
      meta: paginationMeta(query.page, query.pageSize, filtered.length),
    });
  }
}