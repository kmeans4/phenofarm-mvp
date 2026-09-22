import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

const MAX_SAVED_FILTERS = 5;
const VALID_SORTS = new Set(["default", "price-asc", "price-desc", "thc-asc", "thc-desc", "name-asc", "name-desc"]);

interface SavedFilterPayload {
  id?: string;
  name?: string;
  filters?: unknown;
  searchQuery?: string;
  sortBy?: string;
  createdAt?: string;
}

async function requireDispensary() {
  const session = await getAuthSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = session.user;
  if (user.role !== "DISPENSARY" || !user.dispensaryId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

function normalizeFilters(value: unknown): Prisma.InputJsonValue {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    productTypes: Array.isArray(record.productTypes) ? record.productTypes.map(String).slice(0, 30) : [],
    thcRanges: Array.isArray(record.thcRanges) ? record.thcRanges.map(String).slice(0, 30) : [],
    priceRanges: Array.isArray(record.priceRanges) ? record.priceRanges.map(String).slice(0, 30) : [],
    recentlyAdded: record.recentlyAdded === true,
    trending: record.trending === true,
  };
}

function normalizeSavedFilters(value: unknown): Array<Required<Pick<SavedFilterPayload, "name" | "sortBy">> & {
  id?: string;
  filters: Prisma.InputJsonValue;
  searchQuery: string;
  createdAt?: Date;
}> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = item && typeof item === "object" ? item as SavedFilterPayload : {};
      const name = String(record.name || "").trim().slice(0, 80);
      if (!name) return null;

      const sortBy = VALID_SORTS.has(String(record.sortBy)) ? String(record.sortBy) : "default";
      const createdAt = record.createdAt ? new Date(record.createdAt) : undefined;

      return {
        id: record.id ? String(record.id) : undefined,
        name,
        filters: normalizeFilters(record.filters),
        searchQuery: String(record.searchQuery || "").trim().slice(0, 160),
        sortBy,
        createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, MAX_SAVED_FILTERS);
}

export async function GET() {
  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filters = await db.dispensarySavedFilter.findMany({
      where: { dispensaryId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      filters: filters.map((filter) => ({
        id: filter.id,
        name: filter.name,
        filters: filter.filters,
        searchQuery: filter.searchQuery,
        sortBy: filter.sortBy,
        createdAt: filter.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error loading saved filters:", error);
    return NextResponse.json({ error: "Failed to load saved filters" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.filters)) return NextResponse.json({ error: 'Provide filters.' }, { status: 400 });
    const filters = normalizeSavedFilters(body.filters);
    const key = (filter: { name: string; filters: unknown; searchQuery: string; sortBy: string }) => JSON.stringify([filter.name, normalizeFilters(filter.filters), filter.searchQuery, filter.sortBy]);
    const saved = await db.$transaction(async tx => {
      const existing = await tx.dispensarySavedFilter.findMany({ where: { dispensaryId } });
      const incoming = new Map(filters.map(filter => [key(filter), filter]));
      const existingKeys = new Set(existing.map(key));
      await tx.dispensarySavedFilter.deleteMany({ where: { dispensaryId, id: { in: existing.filter(filter => !incoming.has(key(filter))).map(filter => filter.id) } } });
      const additions = [...incoming.values()].filter(filter => !existingKeys.has(key(filter)));
      if (additions.length) await tx.dispensarySavedFilter.createMany({ data: additions.map(filter => ({ name: filter.name, filters: filter.filters, searchQuery: filter.searchQuery, sortBy: filter.sortBy, ...(filter.createdAt ? { createdAt: filter.createdAt } : {}), dispensaryId })) });
      return tx.dispensarySavedFilter.findMany({ where: { dispensaryId }, orderBy: { createdAt: 'desc' } });
    });
    return NextResponse.json({ filters: saved });
  } catch (error) {
    console.error("Error saving saved filters:", error);
    return NextResponse.json({ error: "Failed to save saved filters" }, { status: 500 });
  }
}
