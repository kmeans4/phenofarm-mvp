import { AccountAccessCard } from '../components/AccountAccessCard';
import { AccountAccessForm } from '../components/AccountAccessForm';
export default function ConfirmEmailChangePage() {
  return <AccountAccessCard title="Confirm your new email" description="Confirm to use this address for sign-in. You will be signed out on other devices. Your password stays the same."><AccountAccessForm mode="confirm-email-change" /></AccountAccessCard>;
}
