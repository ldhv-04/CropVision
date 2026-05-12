import { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { useLayoutMode } from '../../platform/hooks/useLayoutMode';
import { COLORS, SPACING, FONT_SIZE } from '../../@core/constants/theme';

import { AdminSummaryGrid } from './AdminSummaryGrid';
import { AdminUserList } from './AdminUserList';
import { AdminSampleList } from './AdminSampleList';

export function AdminLayout() {
  const { isCompact } = useLayoutMode();
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);

  const {
    summary,
    users,
    samples,
    isLoading,
    isRefreshing,
    actionKey,
    error,
    loadAdminData,
    toggleUserRole,
    deleteUser,
    deleteSample,
  } = useAdminStore();

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Đang tải dữ liệu quản trị...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <View style={[styles.toolbar, isCompact && styles.toolbarCompact]}>
          <View>
            <Text style={styles.toolbarTitle}>Bảng quản trị Admin</Text>
            <Text style={styles.toolbarSub}>Quản lý người dùng, role và lịch sử hệ thống</Text>
          </View>
          
          <Pressable
            style={styles.refreshBtn}
            onPress={() => loadAdminData(token, true)}
            disabled={isRefreshing}
          >
            <Text style={styles.refreshText}>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</Text>
          </Pressable>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <AdminSummaryGrid summary={summary} />

        <AdminUserList
          users={users}
          actionKey={actionKey}
          onToggleRole={(user) => toggleUserRole(token, user)}
          onDelete={(id) => deleteUser(token, id)}
        />

        <AdminSampleList
          samples={samples}
          actionKey={actionKey}
          onDelete={(id) => deleteSample(token, id)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  inner: { width: '100%' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loaderText: { color: COLORS.textSecondary, marginTop: SPACING.md },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  toolbarCompact: { flexDirection: 'column', alignItems: 'flex-start', gap: SPACING.md },
  toolbarTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: 'bold', marginBottom: 4 },
  toolbarSub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  refreshBtn: { backgroundColor: `${COLORS.primary}20`, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 6, borderWidth: 1, borderColor: COLORS.primary },
  refreshText: { color: COLORS.primary, fontWeight: 'bold' },
  errorBox: { backgroundColor: `${COLORS.danger}20`, padding: SPACING.md, borderRadius: 6, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontWeight: '600' },
});
