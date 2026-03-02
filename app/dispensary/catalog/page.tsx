import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import CatalogContent from "./CatalogContent";

export default async function DispensaryCatalogPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user as { role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  // CatalogContent now handles data fetching via API with infinite scroll
  return <CatalogContent />;
}
