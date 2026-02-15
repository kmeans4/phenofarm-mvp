import { UserRole, OrderStatus } from '@prisma/client';

export type ExtendedUser = {
  id: string;
  email: string;
  role: UserRole;
  growerId?: string;
  dispensaryId?: string;
  name?: string | null;
};

export type AuthSession = {
  user: ExtendedUser;
  expires: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type Product = {
  id: string;
  name: string;
  productType?: string | null;
  subType?: string | null;
  strain?: string;
  strainId?: string | null;
  category?: string;
  subcategory?: string;
  thc?: number;
  cbd?: number;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  description?: string | null;
  images: string[];
  growerId: string;
  batchId?: string | null;
  sku?: string | null;
  brand?: string | null;
  ingredients?: string | null;
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  orderId: string;
  growerId: string;
  dispensaryId: string;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Re-export product type utilities for convenience
export {
  PRODUCT_TYPES_WITH_SUBTYPES,
  PRODUCT_TYPE_NAMES,
  getSubTypesForProductType,
  hasSubTypes,
  getAllProductTypes,
  getProductTypeInfo,
  type ProductTypeName,
  type SubTypeFor,
  type ProductTypeInfo,
} from '@/lib/product-types';
