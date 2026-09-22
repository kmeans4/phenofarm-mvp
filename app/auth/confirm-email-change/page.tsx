import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default function ConfirmEmailChangePage() {
  return <AccountAccessCard title="Confirm your new email" description="This updates your login address and signs out previous sessions. Your password stays the same."><AccountAccessForm mode="confirm-email-change" /></AccountAccessCard>;
}
