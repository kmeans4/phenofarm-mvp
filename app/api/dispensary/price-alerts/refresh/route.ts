import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";

interface PriceAlertPayload {
  id?: string;
  productId: string;
  targetPrice: number | string;
  currentPrice: number | string;
  originalPrice?: number | string | null;
  isTriggered?: boolean;
  triggeredAt?: string | null;
  createdAt?: string;
}

async function requireDispensary() {
  const session = await getAuthSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = session.user;
  if (user.role !== "DISPENSARY" || !user.dispensaryId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user };
}

function toPrice(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatStoredAlert(alert: {
  id: string;
  productId: string;
  targetPrice: unknown;
  currentPrice: unknown;
  originalPrice: unknown;
  isTriggered: boolean;
  triggeredAt: Date | null;
  createdAt: Date;
  product: {
    name: string;
    price: unknown;
    images: string[];
    growerId: string;
    productType: string | null;
    unit: string;
    thcLegacy: number | null;
    grower: { businessName: string };
    batch: { thc: number | null } | null;
  };
}) {
  const currentPrice = Number(alert.product.price);
  const originalPrice = alert.originalPrice ? Number(alert.originalPrice) : null;

  return {
    id: alert.id,
    productId: alert.productId,
    productName: alert.product.name,
    productImage: alert.product.images?.[0],
    growerName: alert.product.grower.businessName,
    growerId: alert.product.growerId,
    targetPrice: Number(alert.targetPrice),
    currentPrice,
    originalPrice,
    thc: alert.product.batch?.thc ?? alert.product.thcLegacy ?? null,
    productType: alert.product.productType,
    unit: alert.product.unit,
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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDispensary();
    if ("error" in auth) return auth.error;
    const dispensaryId = auth.user.dispensaryId;
    if (!dispensaryId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({})) as { alerts?: PriceAlertPayload[] };
    const clientAlerts = Array.isArray(body.alerts) ? body.alerts : [];

    if (clientAlerts.length > 0) {
      const productIds = Array.from(new Set(clientAlerts.map((alert) => alert.productId).filter(Boolean)));
      const products = await db.product.findMany({
        where: { id: { in: productIds }, isDeleted: false },
        select: { id: true, price: true },
      });

      const updatedAlerts = clientAlerts.map((alert) => {
        const product = products.find((item) => item.id === alert.productId);
        if (!product) return alert;

        const currentPrice = Number(product.price);
        const targetPrice = toPrice(alert.targetPrice);
        const alertCurrentPrice = toPrice(alert.currentPrice);
        const isTriggered = currentPrice <= targetPrice && currentPrice < alertCurrentPrice;
        const originalPrice = alert.originalPrice ? Number(alert.originalPrice) : null;

        return {
          ...alert,
          currentPrice,
          isTriggered: isTriggered || alert.isTriggered,
          triggeredAt: isTriggered ? new Date().toISOString() : alert.triggeredAt,
          originalPrice: isTriggered ? alertCurrentPrice : alert.originalPrice,
          discountPercent: originalPrice
            ? Math.round(((Number(originalPrice) - currentPrice) / Number(originalPrice)) * 100)
            : undefined,
        };
      });

      return NextResponse.json({ alerts: updatedAlerts });
    }

    const alerts = await db.dispensaryPriceAlert.findMany({
      where: { dispensaryId },
      include: {
        product: {
          include: {
            grower: { select: { businessName: true } },
            batch: { select: { thc: true } },
          },
        },
      },
    });

    if (alerts.length > 0) {
      await db.$transaction(
        alerts.map((alert) => {
          const currentPrice = Number(alert.product.price);
          const targetPrice = Number(alert.targetPrice);
          const previousPrice = Number(alert.currentPrice);
          const triggeredNow = currentPrice <= targetPrice && currentPrice < previousPrice;

          return db.dispensaryPriceAlert.update({
            where: { id: alert.id },
            data: {
              currentPrice,
              isTriggered: alert.isTriggered || triggeredNow,
              triggeredAt: triggeredNow ? new Date() : alert.triggeredAt,
              originalPrice: triggeredNow ? previousPrice : alert.originalPrice,
            },
          });
        })
      );
    }

    const refreshed = await db.dispensaryPriceAlert.findMany({
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

    return NextResponse.json({ alerts: refreshed.map(formatStoredAlert) });
  } catch (error) {
    if (isMissingPriceAlertsTableError(error)) {
      console.warn("Price alerts table is not available; skipping account-backed refresh.");
      return NextResponse.json({ alerts: [] });
    }

    console.error("Error refreshing price alerts:", error);
    return NextResponse.json({ error: "Failed to refresh price alerts" }, { status: 500 });
  }
}
