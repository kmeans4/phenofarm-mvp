import { getAuthSession } from "@/lib/auth-helpers";
import { customerSelect, customerWhere } from "@/lib/customers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ExtendedUser } from "@/types";
import EditCustomerForm from "./components/EditCustomerForm";

interface CustomerData {
  id: string;
  businessName: string;
  licenseNumber: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  description: string | null;
  email?: string;
  contactName?: string;
  isPlatformManaged: boolean;
}

async function fetchCustomer(id: string, growerId: string): Promise<CustomerData | null> {
  const dispensary = await db.dispensary.findFirst({
    where: { id, ...customerWhere(growerId) },
    select: customerSelect,
  });
  
  if (!dispensary) return null;
  
  return {
    id: dispensary.id,
    businessName: dispensary.businessName,
    licenseNumber: dispensary.licenseNumber,
    phone: dispensary.phone,
    address: dispensary.address,
    city: dispensary.city,
    state: dispensary.state,
    zip: dispensary.zip,
    website: dispensary.website,
    description: dispensary.description,
    email: dispensary.user?.email || dispensary.offPlatformEmail || undefined,
    contactName: dispensary.user?.name || dispensary.contactName || undefined,
    isPlatformManaged: Boolean(dispensary.userId) || dispensary.createdByGrowerId !== growerId,
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: PageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as ExtendedUser;

  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const customer = await fetchCustomer(id, user.growerId);

  if (!customer) {
    notFound();
  }

  return <EditCustomerForm customer={customer} />;
}
