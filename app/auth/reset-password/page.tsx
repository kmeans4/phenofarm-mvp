import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default function ResetPasswordPage() {
  return <AccountAccessCard title="Choose a new password" description="This link can be used once. Resetting your password signs you out on other devices."><AccountAccessForm mode="reset" /></AccountAccessCard>;
}
