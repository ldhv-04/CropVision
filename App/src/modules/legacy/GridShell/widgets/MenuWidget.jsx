/**
 * MenuWidget — legacy GridShell sidebar compatibility renderer.
 *
 * Route data lives in ../compat/menuRoutes so mixed owner links are explicit.
 * Uses useTheme() for dynamic dark/light mode color resolution.
 */

import { router, usePathname } from 'expo-router';
import { useAuthStore } from '../../../@core/auth/useAuthStore';
import { useTheme } from '../../../@core/context/ThemeContext';
import { COMPAT_MENU_SECTIONS } from '../compat/menuRoutes';

export function MenuWidget() {
  const pathname   = usePathname();
  const logout     = useAuthStore((s) => s.logout);
  const user       = useAuthStore((s) => s.user);
  const isAdmin    = user?.role === 'admin';
  const { colors } = useTheme();

  const activeKey = COMPAT_MENU_SECTIONS.flatMap((s) => s.items)
    .find((i) => pathname.includes(i.key) || (i.key === 'analysis' && pathname.includes('inference')))?.key ?? 'dashboard';

  const menuWidgetStyle = {
    padding: 12,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    backgroundColor: colors.surface,
  };

  const sectionLabelStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: '8px 12px 4px',
  };

  const navItemBase = {
    width: '100%', textAlign: 'left', padding: '9px 12px',
    borderRadius: 10, border: 'none', backgroundColor: 'transparent',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 9,
    transition: 'background-color 0.15s, color 0.15s',
  };

  const logoutStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: `1px solid ${colors.dangerBorder}`,
    backgroundColor: `${colors.danger}12`,
    color: colors.danger, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
  };

  return (
    <div style={menuWidgetStyle}>
      {/* Navigation sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {COMPAT_MENU_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((i) => !i.adminOnly || isAdmin);
          if (!visibleItems.length) return null;
          return (
            <div key={section.label}>
              <div style={sectionLabelStyle}>{section.label}</div>
              {visibleItems.map((item) => {
                const active = activeKey === item.key;
                const itemStyle = {
                  ...navItemBase,
                  color: active ? colors.primaryGlow : colors.textSecondary,
                  backgroundColor: active ? `${colors.primary}28` : 'transparent',
                  fontWeight: active ? 700 : 500,
                };
                return (
                  <button
                    key={item.key}
                    onClick={() => router.push(item.href)}
                    style={itemStyle}
                  >
                    <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>
                      {item.icon}
                    </span>
                    {item.label}
                    {active && (
                      <span style={{
                        marginLeft: 'auto', width: 6, height: 6,
                        borderRadius: 3, backgroundColor: colors.primaryGlow,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <button onClick={logout} style={logoutStyle}>
        <span>🚪</span> Đăng xuất
      </button>
    </div>
  );
}
