import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default function ForgotPasswordPage() {
  return <AccountAccessCard title="Reset your password" description="Enter your account email. We will send a link that expires in 30 minutes."><AccountAccessForm mode="request-reset" /></AccountAccessCard>;
}
