/**
 * AppShell — persistent application chrome.
 *
 * Desktop: left sidebar with nav links + user info.
 * Compact (tablet/phone): top bar with inline nav links.
 *
 * Uses Expo Router's usePathname() to highlight the active route.
 * Uses useLayoutMode() for responsive breakpoints.
 * Uses useAuthStore() for user info and logout.
 */

import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuthStore } from '../auth/useAuthStore';
import { useLayoutMode } from '../../platform/hooks/useLayoutMode';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';

const NAV_ITEMS = [
  { label: 'Phân tích ảnh',    href: '/inference', key: 'inference' },
  { label: 'Lịch sử mẫu vật',  href: '/history',   key: 'history'   },
  { label: 'Quản trị hệ thống', href: '/admin',     key: 'admin',  adminOnly: true },
];

function NavItem({ item, isActive, compact = false }) {
  return (
    <Pressable
      style={[styles.navItem, compact && styles.navItemCompact, isActive && styles.navItemActive]}
      onPress={() => router.push(item.href)}
    >
      <Text style={[styles.navText, isActive && styles.navTextActive]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export function AppShell({ children }) {
  const pathname = usePathname();
  const { isCompact } = useLayoutMode();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isAdmin = user?.role === 'admin';
  const userLabel = user?.fullName || user?.email || 'Người dùng';

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  // Determine active key from pathname
  const activeKey = visibleItems.find((item) => pathname.includes(item.key))?.key ?? 'inference';

  if (!isCompact) {
    // ─── Desktop: persistent left sidebar ───────────────────────
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.sidebar}>
          {/* Brand */}
          <View style={styles.brand}>
            <Text style={styles.brandName}>CropVision AI</Text>
            <Text style={[styles.roleLabel, { color: isAdmin ? COLORS.primary : COLORS.textSecondary }]}>
              {isAdmin ? `Admin · ${userLabel}` : userLabel}
            </Text>
          </View>

          {/* Nav */}
          <View style={styles.navList}>
            {visibleItems.map((item) => (
              <NavItem key={item.key} item={item} isActive={activeKey === item.key} />
            ))}
          </View>

          {/* Logout */}
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
        </View>

        {/* Content area */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  // ─── Compact: top bar + content below ───────────────────────
  return (
    <SafeAreaView style={styles.compactRoot}>
      <View style={styles.topBar}>
        <View style={styles.topBarBrand}>
          <Text style={styles.topBarTitle}>CropVision AI</Text>
          <Text style={styles.topBarRole}>
            {isAdmin ? `Admin: ${userLabel}` : userLabel}
          </Text>
        </View>

        <View style={styles.topBarNav}>
          {visibleItems.map((item) => (
            <NavItem key={item.key} item={item} isActive={activeKey === item.key} compact />
          ))}
        </View>

        <Pressable style={styles.logoutBtnCompact} onPress={logout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </View>

      <View style={styles.compactContent}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Desktop
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  sidebar: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  brand: {
    marginBottom: SPACING.xl,
  },
  brandName: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  roleLabel: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
  },
  navList: {
    flex: 1,
    gap: SPACING.xs,
  },
  navItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  navItemActive: {
    backgroundColor: `${COLORS.primary}18`,
  },
  navText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Compact (tablet + phone)
  compactRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  topBarBrand: {
    marginBottom: SPACING.sm,
  },
  topBarTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  topBarRole: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  topBarNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  navItemCompact: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  logoutBtnCompact: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  compactContent: {
    flex: 1,
  },
});
