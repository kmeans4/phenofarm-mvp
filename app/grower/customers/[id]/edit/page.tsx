import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
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
}

async function fetchCustomer(id: string): Promise<CustomerData | null> {
  const dispensary = await db.dispensary.findUnique({
    where: { id },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
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
    email: dispensary.user?.email || undefined,
    contactName: dispensary.user?.name || undefined,
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;

  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const customer = await fetchCustomer(id);

  if (!customer) {
    redirect('/grower/customers');
  }

  return <EditCustomerForm customer={customer} />;
}
