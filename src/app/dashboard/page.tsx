import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // In production, check if user is authenticated
  // For now, just redirect to login
  redirect("/login");
}
