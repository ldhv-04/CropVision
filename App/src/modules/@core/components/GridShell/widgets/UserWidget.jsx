/**
 * UserWidget — Current user info + role badge
 */

import { useAuthStore } from '../../../auth/useAuthStore';
import { COLORS } from '../../../constants/theme';

export function UserWidget() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  return (
    <div style={{ padding: 14, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>Đang đăng nhập</span>
      <span style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 600 }}>
        {user?.fullName || user?.email}
      </span>
      <span style={{
        display: 'inline-block', marginTop: 4,
        backgroundColor: isAdmin ? `${COLORS.primary}22` : COLORS.border,
        color: isAdmin ? COLORS.primary : COLORS.textSecondary,
        fontSize: 11, fontWeight: 600, padding: '2px 8px',
        borderRadius: 999, width: 'fit-content',
      }}>
        {isAdmin ? 'Admin' : 'User'}
      </span>
    </div>
  );
}
