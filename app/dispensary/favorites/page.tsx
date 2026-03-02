import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FavoritesContent from "./FavoritesContent";

export const metadata = {
  title: "My Favorites | PhenoFarm",
  description: "View and manage your favorite cannabis products",
};

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as { role: string };
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  return <FavoritesContent />;
}
