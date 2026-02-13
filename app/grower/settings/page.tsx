import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";

export default async function GrowerSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Grower Settings</h1>
      <SettingsForm />
    </div>
  );
}
