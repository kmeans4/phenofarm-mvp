import { getBuyerCatalog } from '@/lib/buyer-catalog';
import { getAuthSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import CatalogContent from "./CatalogContent";

export default async function DispensaryCatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (typeof value === 'string') params.set(key, value);
  params.set('page', '1'); params.set('limit', '20'); params.delete('cursor');
  const initialData = await getBuyerCatalog(user.dispensaryId, params);
  return <CatalogContent initialData={initialData} />;
}
