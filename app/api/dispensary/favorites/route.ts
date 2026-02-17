import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { AuthSession } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = (session as AuthSession).user;
    
    if (user.role !== 'DISPENSARY') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch full product details for the given IDs
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        grower: {
          select: {
            id: true,
            businessName: true,
            city: true,
            state: true,
            isVerified: true,
          },
        },
        strain: {
          select: {
            id: true,
            name: true,
            genetics: true,
          },
        },
        batch: {
          select: {
            thc: true,
            cbd: true,
          },
        },
      },
    });

    // Transform to match the Product interface
    const formattedProducts = products.map(product => {
      const strainName = product.strain?.name || product.strainLegacy || '';
      const genetics = product.strain?.genetics || '';
      // Infer strain type from strain name or genetics
      const strainType = genetics.toLowerCase().includes('indica') ? 'Indica' :
                        genetics.toLowerCase().includes('sativa') ? 'Sativa' :
                        genetics.toLowerCase().includes('hybrid') ? 'Hybrid' :
                        strainName.toLowerCase().includes('indica') ? 'Indica' :
                        strainName.toLowerCase().includes('sativa') ? 'Sativa' :
                        strainName.toLowerCase().includes('hybrid') ? 'Hybrid' : null;
      
      return {
        id: product.id,
        name: product.name,
        price: parseFloat(String(product.price)),
        strain: strainName || null,
        strainId: product.strainId,
        strainType,
        productType: product.productType,
        subType: product.subType,
        unit: product.unit,
        thc: product.batch?.thc ?? product.thcLegacy ?? null,
        cbd: product.batch?.cbd ?? product.cbdLegacy ?? null,
        images: product.images || [],
        inventoryQty: product.inventoryQty,
        grower: {
          id: product.grower.id,
          businessName: product.grower.businessName,
          location: product.grower.city && product.grower.state 
            ? `${product.grower.city}, ${product.grower.state}`
            : product.grower.city || product.grower.state || null,
          isVerified: product.grower.isVerified,
        },
      };
    });

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching favorite products:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite products" },
      { status: 500 }
    );
  }
}
