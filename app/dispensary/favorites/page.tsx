import { redirect } from "next/navigation";

export const metadata = {
  title: "My Favorites | PhenoShop",
  description: "View and manage your favorite cannabis products",
};

export default async function FavoritesPage() {
  redirect('/dispensary/saved?tab=favorites');
}
