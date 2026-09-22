import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default function ResetPasswordPage() {
  return <AccountAccessCard title="Choose a new password" description="Your reset link works once. Resetting signs out all previous sessions."><AccountAccessForm mode="reset" /></AccountAccessCard>;
}
