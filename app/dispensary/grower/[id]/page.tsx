import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/prisma/client";
import { 
  MapPin, 
  Phone, 
  Globe, 
  CheckCircle, 
  Package, 
  TrendingUp, 
  MessageCircle,
  ArrowLeft,
  Shield
} from "lucide-react";
import GrowerShopContent from "./GrowerShopContent";

interface GrowerPageProps {
  params: Promise<{ id: string }>;
}

async function getGrowerWithProducts(id: string) {
  const grower = await db.grower.findUnique({
    where: { id },
    include: {
      products: {
        where: { 
          isAvailable: true,
          isDeleted: false 
        },
        include: {
          strain: true,
          batch: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      user: {
        select: {
          email: true,
        },
      },
      _count: {
        select: {
          products: {
            where: {
              isAvailable: true,
              isDeleted: false,
            },
          },
          orders: true,
        },
      },
    },
  });

  return grower;
}

export default async function GrowerPage({ params }: GrowerPageProps) {
  const { id } = await params;
  const grower = await getGrowerWithProducts(id);

  if (!grower) {
    notFound();
  }

  // Calculate stats
  const totalProducts = grower._count.products;
  const totalOrders = grower._count.orders;
  const avgThc = grower.products.length > 0
    ? grower.products.reduce((sum, p) => sum + (p.batch?.thc || p.thcLegacy || 0), 0) / grower.products.length
    : 0;

  // Get unique product types
  const productTypes = [...new Set(grower.products.map(p => p.productType).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/dispensary/catalog" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Link>
        </div>
      </div>

      {/* Grower Header / Banner */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo / Avatar */}
            <div className="flex-shrink-0">
              {grower.logo ? (
                <img 
                  src={grower.logo} 
                  alt={grower.businessName}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border-4 border-white/20">
                  <span className="text-4xl font-bold text-white/80">
                    {grower.businessName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Grower Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{grower.businessName}</h1>
                {grower.isVerified && (
                  <div className="flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span className="text-sm font-medium text-green-100">Verified</span>
                  </div>
                )}
              </div>

              {grower.description && (
                <p className="text-green-100 text-lg max-w-2xl mb-4">
                  {grower.description}
                </p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-green-100">
                {grower.city && grower.state && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {grower.city}, {grower.state}
                  </span>
                )}
                {grower.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {grower.phone}
                  </span>
                )}
                {grower.website && (
                  <a 
                    href={grower.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {grower.licenseNumber && (
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    License: {grower.licenseNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button className="inline-flex items-center justify-center gap-2 bg-white text-green-900 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
                Contact Grower
              </button>
              <button className="inline-flex items-center justify-center gap-2 bg-green-600/30 text-white border border-green-400/30 px-6 py-3 rounded-lg font-semibold hover:bg-green-600/50 transition-colors">
                Follow Shop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-sm">Products</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Orders Filled</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mb-1">
                <span className="text-sm">Avg THC</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {avgThc > 0 ? `${avgThc.toFixed(1)}%` : "N/A"}
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 mb-1">
                <span className="text-sm">Categories</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{productTypes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GrowerShopContent 
          products={grower.products} 
          growerName={grower.businessName}
          growerId={grower.id}
        />
      </div>
    </div>
  );
}
