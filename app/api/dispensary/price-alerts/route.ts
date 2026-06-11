import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

const MAX_PRICE_ALERTS = 20;

interface PriceAlertPayload {
  id?: string;
  productId?: string;
  targetPrice?: number | string;
  currentPrice?: number | string;
  originalPrice?: number | string | null;
  isTriggered?: boolean;
  triggeredAt?: string | null;
}

interface PriceAlertRecord {
  id: string;
  productId: string;
  targetPrice: unknown;
  currentPrice: unknown;
  originalPrice: unknown;
  createdAt: Date;
  isTriggered: boolean;
  triggeredAt: Date | null;
  product: {
    id: string;
    growerId: string;
    name: string;
    price: unknown;
    images: string[];
    thcLegacy: number | null;
    productType: string | null;
    unit: string;
    grower: { businessName: string };
    batch: { thc: number | null } | null;
  } | null;
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

function toPositivePrice(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function toOptionalPrice(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeAlerts(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const alerts: Array<{
    productId: string;
    targetPrice: number;
    currentPrice: number;
    originalPrice: number | null;
    isTriggered: boolean;
    triggeredAt: Date | null;
  }> = [];

  for (const raw of value) {
    const record = raw && typeof raw === "object" ? raw as PriceAlertPayload : {};
    const productId = String(record.productId || "").trim();
    const targetPrice = toPositivePrice(record.targetPrice);
    const currentPrice = toPositivePrice(record.currentPrice);
    const originalPrice = toOptionalPrice(record.originalPrice);
    const triggeredAt = record.triggeredAt ? new Date(record.triggeredAt) : null;

    if (!productId || seen.has(productId) || !targetPrice || !currentPrice) continue;

    seen.add(productId);
    alerts.push({
      productId,
      targetPrice,
      currentPrice,
      originalPrice,
      isTriggered: record.isTriggered === true,
      triggeredAt: triggeredAt && !Number.isNaN(triggeredAt.getTime()) ? triggeredAt : null,
    });

    if (alerts.length >= MAX_PRICE_ALERTS) break;
  }

  return alerts;
}

function formatAlert(alert: PriceAlertRecord) {
  const product = alert.product;
  const currentPrice = Number(product?.price ?? alert.currentPrice);
  const originalPrice = alert.originalPrice ? Number(alert.originalPrice) : null;

  return {
    id: alert.id,
    productId: alert.productId,
    productName: product?.name || "Unavailable product",
    productImage: product?.images?.[0],
    growerName: product?.grower?.businessName || "Unknown grower",
    growerId: product?.growerId || "",
    targetPrice: Number(alert.targetPrice),
    currentPrice,
    originalPrice,
    thc: product?.batch?.thc ?? product?.thcLegacy ?? null,
    productType: product?.productType ?? null,
    unit: product?.unit ?? null,
    createdAt: alert.createdAt.toISOString(),
    isTriggered: alert.isTriggered,
    triggeredAt: alert.triggeredAt?.toISOString(),
    discountPercent: originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : undefined,
  };
}

function isMissingPriceAlertsTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return String(error.meta?.table ?? error.message).includes("dispensary_price_alerts");
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("dispensary_price_alerts") && message.toLowerCase().includes("does not exist");
}

function serializeBrowserLocalAlerts(alerts: ReturnType<typeof normalizeAlerts>) {
  const now = new Date().toISOString();

  return alerts.map((alert) => ({
    id: alert.productId,
    productId: alert.productId,
    productName: "Saved product",
    productImage: undefined,
    growerName: "Unknown grower",
    growerId: "",
    targetPrice: alert.targetPrice,
    currentPrice: alert.currentPrice,
    originalPrice: alert.originalPrice ?? undefined,
    thc: null,
    productType: null,
    unit: null,
    createdAt: now,
    isTriggered: alert.isTriggered,
    triggeredAt: alert.triggeredAt?.toISOString(),
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

    const alerts = await db.dispensaryPriceAlert.findMany({
      where: { dispensaryId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            grower: { select: { businessName: true } },
            batch: { select: { thc: true } },
          },
        },
      },
    });

    return NextResponse.json({ alerts: alerts.map(formatAlert) });
  } catch (error) {
    if (isMissingPriceAlertsTableError(error)) {
      console.warn("Price alerts table is not available; falling back to browser-saved alerts.");
      return NextResponse.json({ alerts: [] });
    }

    console.error("Error loading price alerts:", error);
    return NextResponse.json({ error: "Failed to load price alerts" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const alerts = normalizeAlerts(body.alerts);

  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const productIds = alerts.map((alert) => alert.productId);
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        isDeleted: false,
      },
      select: { id: true },
    });
    const validProductIds = new Set(products.map((product) => product.id));

    await db.$transaction([
      db.dispensaryPriceAlert.deleteMany({
        where: { dispensaryId },
      }),
      ...alerts
        .filter((alert) => validProductIds.has(alert.productId))
        .map((alert) =>
          db.dispensaryPriceAlert.create({
            data: {
              dispensaryId,
              productId: alert.productId,
              targetPrice: alert.targetPrice,
              currentPrice: alert.currentPrice,
              originalPrice: alert.originalPrice,
              isTriggered: alert.isTriggered,
              triggeredAt: alert.triggeredAt,
            },
          })
        ),
    ]);

    const savedAlerts = await db.dispensaryPriceAlert.findMany({
      where: { dispensaryId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            grower: { select: { businessName: true } },
            batch: { select: { thc: true } },
          },
        },
      },
    });

    return NextResponse.json({ alerts: savedAlerts.map(formatAlert) });
  } catch (error) {
    if (isMissingPriceAlertsTableError(error)) {
      console.warn("Price alerts table is not available; keeping alerts browser-local.");
      return NextResponse.json({ alerts: serializeBrowserLocalAlerts(alerts) });
    }

    console.error("Error saving price alerts:", error);
    return NextResponse.json({ error: "Failed to save price alerts" }, { status: 500 });
  }
}
