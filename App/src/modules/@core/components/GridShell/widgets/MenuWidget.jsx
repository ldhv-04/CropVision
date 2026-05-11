/**
 * MenuWidget — Sidebar navigation + logout
 * Filters admin-only items based on user role.
 */

import { router, usePathname } from 'expo-router';
import { useAuthStore } from '../../../auth/useAuthStore';
import { ws } from '../styles';

const NAV_ITEMS = [
  { label: 'Phân tích ảnh', href: '/inference', key: 'inference' },
  { label: 'Lịch sử mẫu vật', href: '/history', key: 'history' },
  { label: 'Quản trị', href: '/admin', key: 'admin', adminOnly: true },
];

export function MenuWidget() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const activeKey = NAV_ITEMS.find((i) => pathname.includes(i.key))?.key ?? 'inference';
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div style={ws.menuWidget}>
      <div style={ws.navList}>
        {items.map((item) => {
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              style={active ? { ...ws.navItem, ...ws.navItemActive } : ws.navItem}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <button onClick={logout} style={ws.logoutBtn}>
        Đăng xuất
      </button>
    </div>
  );
}
