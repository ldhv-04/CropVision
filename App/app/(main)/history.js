import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import SampleList from '../../src/modules/history/components/SampleList';

export default function HistoryScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  return <SampleList authToken={token} currentUser={user} />;
}
