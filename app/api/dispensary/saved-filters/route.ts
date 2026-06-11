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

function isMissingSavedFiltersTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return String(error.meta?.table ?? error.message).includes("dispensary_saved_filters");
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("dispensary_saved_filters") && message.toLowerCase().includes("does not exist");
}

function serializeSavedFilters(filters: ReturnType<typeof normalizeSavedFilters>) {
  return filters.map((filter, index) => ({
    id: filter.id || `${Date.now()}-${index}`,
    name: filter.name,
    filters: filter.filters,
    searchQuery: filter.searchQuery,
    sortBy: filter.sortBy,
    createdAt: (filter.createdAt || new Date()).toISOString(),
  }));
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
    if (isMissingSavedFiltersTableError(error)) {
      console.warn("Saved filters table is not available; falling back to browser-saved filters.");
      return NextResponse.json({ filters: [] });
    }

    console.error("Error loading saved filters:", error);
    return NextResponse.json({ error: "Failed to load saved filters" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const filters = normalizeSavedFilters(body.filters);

  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.$transaction([
      db.dispensarySavedFilter.deleteMany({
        where: { dispensaryId },
      }),
      ...filters.map((filter) =>
        db.dispensarySavedFilter.create({
          data: {
            dispensaryId,
            name: filter.name,
            filters: filter.filters,
            searchQuery: filter.searchQuery,
            sortBy: filter.sortBy,
            ...(filter.createdAt ? { createdAt: filter.createdAt } : {}),
          },
        })
      ),
    ]);

    return NextResponse.json({ filters: serializeSavedFilters(filters) });
  } catch (error) {
    if (isMissingSavedFiltersTableError(error)) {
      console.warn("Saved filters table is not available; keeping filters browser-local.");
      return NextResponse.json({ filters: serializeSavedFilters(filters) });
    }

    console.error("Error saving saved filters:", error);
    return NextResponse.json({ error: "Failed to save saved filters" }, { status: 500 });
  }
}
