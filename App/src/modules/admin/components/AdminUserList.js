import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { FIXED_ADMIN_EMAIL } from '../../@core/constants/app'; // [M1] shared constant
import { useLayoutMode } from '../../platform/hooks/useLayoutMode';

export function AdminUserList({ users, actionKey, onToggleRole, onDelete }) {
  const { isCompact } = useLayoutMode();

  const handleToggle = (user) => {
    if (user.email === FIXED_ADMIN_EMAIL) return;
    onToggleRole(user);
  };

  const handleDelete = (user) => {
    if (user.email === FIXED_ADMIN_EMAIL) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(`Xóa người dùng\n\nBạn có chắc muốn xóa tài khoản ${user.email}?`)) {
            onDelete(user.id);
        }
        return;
    }

    Alert.alert(
      'Xóa người dùng',
      `Bạn có chắc muốn xóa tài khoản ${user.email}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', style: 'destructive', onPress: () => onDelete(user.id) },
      ]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa có';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý người dùng</Text>
        <Text style={styles.meta}>{users.length} tài khoản</Text>
      </View>

      {users.length === 0 ? (
        <Text style={styles.empty}>Chưa có người dùng nào.</Text>
      ) : (
        users.map((user) => {
          const isFixedAdmin = user.email === FIXED_ADMIN_EMAIL;
          return (
            <View key={user.id} style={styles.row}>
              <View style={[styles.rowHeader, isCompact && styles.col]}>
                <View>
                  <Text style={styles.rowTitle}>{user.full_name}</Text>
                  <Text style={styles.rowSub}>{user.email}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: user.role === 'admin' ? COLORS.primary : COLORS.border }, isCompact && styles.badgeCompact]}>
                  <Text style={styles.badgeText}>{user.role}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Mẫu vật: {user.sample_count}</Text>
                <Text style={styles.metaText}>Tạo: {formatDate(user.created_at)}</Text>
              </View>

              <View style={[styles.actionRow, isCompact && styles.col]}>
                <Pressable
                  style={[styles.btn, isFixedAdmin ? styles.btnDisabled : styles.btnPrimary, isCompact && styles.btnCompact]}
                  onPress={() => handleToggle(user)}
                  disabled={isFixedAdmin || actionKey === `role-${user.id}`}
                >
                  <Text style={styles.btnText}>
                    {actionKey === `role-${user.id}` ? 'Đang xử lý...' : user.role === 'admin' ? 'Hạ quyền' : 'Lên quyền Admin'}
                  </Text>
                </Pressable>
                
                <Pressable
                  style={[styles.btn, isFixedAdmin ? styles.btnDisabled : styles.btnDanger]}
                  onPress={() => handleDelete(user)}
                  disabled={isFixedAdmin || actionKey === `delete-user-${user.id}`}
                >
                  <Text style={styles.btnText}>
                    {actionKey === `delete-user-${user.id}` ? 'Đang xóa...' : 'Xóa tài khoản'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.sm },
  title: { color: COLORS.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  meta: { color: COLORS.primary, fontSize: FONT_SIZE.sm },
  empty: { color: COLORS.textSecondary },
  row: { borderBottomWidth: 1, borderBottomColor: `${COLORS.border}50`, paddingVertical: SPACING.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  col: { flexDirection: 'column', alignItems: 'flex-start' },
  rowTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  rowSub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  badgeCompact: { marginTop: SPACING.xs },
  badgeText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', gap: SPACING.md, marginVertical: SPACING.sm },
  metaText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  btnCompact: { marginBottom: SPACING.xs, width: '100%' },
  btnPrimary: { backgroundColor: `${COLORS.primary}20`, borderWidth: 1, borderColor: COLORS.primary },
  btnDanger: { backgroundColor: `${COLORS.danger}20`, borderWidth: 1, borderColor: COLORS.danger },
  btnDisabled: { opacity: 0.5, backgroundColor: COLORS.border },
  btnText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
});
