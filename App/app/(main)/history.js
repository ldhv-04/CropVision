import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import SampleList from '../../src/modules/history/components/SampleList';

// Legacy sample-history route. Keep until owner-specific history routes exist.
export default function HistoryScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  return <SampleList authToken={token} currentUser={user} />;
}
