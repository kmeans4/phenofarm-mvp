import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

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
  strain?: string;
  category?: string;
  subcategory?: string;
  thc?: number;
  cbd?: number;
  price: number;
  inventoryQty: number;
  unit: string;
  isAvailable: boolean;
  description?: string;
  images: string[];
  growerId: string;
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
