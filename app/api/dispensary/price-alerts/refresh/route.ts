import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    
    if (!session || userRole !== "DISPENSARY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alerts } = await request.json();

    if (!alerts || !Array.isArray(alerts)) {
      return NextResponse.json({ error: "Invalid alerts data" }, { status: 400 });
    }

    const productIds = alerts.map((a: { productId: string }) => a.productId);
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, inventoryQty: true },
    });

    const updatedAlerts = alerts.map((alert: any) => {
      const product = products.find(p => p.id === alert.productId);
      if (!product) return alert;

      const currentPrice = Number(product.price);
      const targetPrice = Number(alert.targetPrice);
      const alertCurrentPrice = Number(alert.currentPrice);
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
  } catch (error) {
    console.error("Error refreshing price alerts:", error);
    return NextResponse.json({ error: "Failed to refresh price alerts" }, { status: 500 });
  }
}
