import { UserRole, UserStatus, OrderStatus, PaymentStatus, ProductCategory, ProductUnitType } from '@prisma/client';

export type ExtendedUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  licenseNumber?: string | null;
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
  slug: string;
  description?: string;
  category: ProductCategory;
  subcategory?: string;
  unitType: ProductUnitType;
  unitSize: number;
  pricePerUnit: number;
  wholesalePrice: number;
  quantityAvailable: number;
  quantityTotal: number;
  thcPercentage?: number;
  cbdPercentage?: number;
  strain?: string;
  origin?: string;
  harvestDate?: Date;
  expireDate?: Date;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  growerId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress?: any;
  shippingMethod?: string;
  shippingCost: number;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  metrcTransId?: string;
  createdAt: Date;
  updatedAt: Date;
};
