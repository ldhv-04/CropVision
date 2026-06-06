/**
 * CropVision Station — System Manager
 *
 * Admin management panel with:
 * - Users table: view, change role, delete
 * - Samples table: view detections, delete
 * Theme-aware: uses useTheme() for light/dark mode support.
 */

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, Alert, RefreshControl, TextInput,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { useAdminStore } from '../../admin/store/useAdminStore';
import { SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { useTheme } from '../../@core/context/ThemeContext';

/** Cross-platform confirm */
function crossPlatformConfirm(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

function getStyles(C) {
  return {
    root: { flex: 1, backgroundColor: C.background },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: C.primaryGlow },
    tabText: { color: C.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
    tabTextActive: { color: C.primaryGlow },
    searchWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
    search: { backgroundColor: C.surface, color: C.textPrimary, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: FONT_SIZE.sm },
    errorBanner: { margin: SPACING.md, padding: SPACING.sm, backgroundColor: C.dangerBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.dangerBorder },
    errorText: { color: C.danger, fontSize: FONT_SIZE.sm },
    loadingCenter: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
    loadingText: { color: C.textMuted, fontSize: FONT_SIZE.sm },
    listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border, gap: SPACING.sm },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
    rowActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    userAvatar: { width: 40, height: 40, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
    sampleIcon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: `${C.info}15`, alignItems: 'center', justifyContent: 'center' },
    userInfo: { flex: 1 },
    userName: { color: C.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
    userEmail: { color: C.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
    userDate: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 1 },
    badge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1 },
    badgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
    actionBtns: { flexDirection: 'row', gap: 6 },
    smallBtn: { width: 30, height: 30, borderRadius: RADIUS.md, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    dangerBtn: { borderColor: `${C.danger}30` },
    smallBtnText: { fontSize: 14, color: C.textSecondary, fontWeight: '700' },
    emptyText: { color: C.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: SPACING.xl },
  };
}

function Badge({ label, color, badgeStyle, badgeTextStyle }) {
  return (
    <View style={[badgeStyle, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
      <Text style={[badgeTextStyle, { color }]}>{label}</Text>
    </View>
  );
}

function UserRow({ user, actionKey, onToggleRole, onDelete, C, styles }) {
  const isAdmin = user.role === 'admin';
  const isActing = actionKey === `role-${user.id}` || actionKey === `delete-user-${user.id}`;

  const confirmDelete = () => crossPlatformConfirm(
    'Xác nhận xóa', `Bạn chắc chắn muốn xóa user "${user.email}"?`, () => onDelete(user.id)
  );

  const confirmToggle = () => crossPlatformConfirm(
    'Thay đổi quyền', `Đổi "${user.email}" thành ${isAdmin ? 'User' : 'Admin'}?`, () => onToggleRole(user)
  );

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.userAvatar, { backgroundColor: isAdmin ? `${C.warning}20` : `${C.info}20` }]}>
          <Text style={{ fontSize: 16 }}>{isAdmin ? '👑' : '👤'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name || 'Chưa đặt tên'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userDate}>Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}</Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        <Badge label={isAdmin ? 'Admin' : 'User'} color={isAdmin ? C.warning : C.info} badgeStyle={styles.badge} badgeTextStyle={styles.badgeText} />
        {isActing ? (
          <ActivityIndicator size="small" color={C.primary} style={{ marginLeft: SPACING.sm }} />
        ) : (
          <View style={styles.actionBtns}>
            <Pressable style={styles.smallBtn} onPress={confirmToggle}>
              <Text style={styles.smallBtnText}>⇄</Text>
            </Pressable>
            <Pressable style={[styles.smallBtn, styles.dangerBtn]} onPress={confirmDelete}>
              <Text style={[styles.smallBtnText, { color: C.danger }]}>✕</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function SampleRow({ sample, actionKey, onDelete, C, styles }) {
  const topDisease = sample.detections?.[0];
  const conf = topDisease ? Math.round(topDisease.confidence * 100) : null;
  const confColor = conf >= 70 ? C.danger : conf >= 40 ? C.warning : C.success;
  const isActing = actionKey === `delete-sample-${sample.id}`;

  const confirmDelete = () => crossPlatformConfirm(
    'Xác nhận xóa', `Xóa mẫu "${sample.sample_name}"?`, () => onDelete(sample.id)
  );

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.sampleIcon}>
          <Text style={{ fontSize: 18 }}>🔬</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{sample.sample_name}</Text>
          <Text style={styles.userEmail}>{topDisease?.disease_class?.replace(/_/g, ' ') || 'Không phát hiện bệnh'}</Text>
          <Text style={styles.userDate}>{sample.owner_email} · {new Date(sample.created_at).toLocaleDateString('vi-VN')}</Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        {conf && <Badge label={`${conf}%`} color={confColor} badgeStyle={styles.badge} badgeTextStyle={styles.badgeText} />}
        {isActing ? (
          <ActivityIndicator size="small" color={C.danger} />
        ) : (
          <Pressable style={[styles.smallBtn, styles.dangerBtn]} onPress={confirmDelete}>
            <Text style={[styles.smallBtnText, { color: C.danger }]}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function StationSystem() {
  const token = useAuthStore((s) => s.token);
  const { colors } = useTheme();
  const C = colors;
  const styles = getStyles(C);
  const { users, samples, isLoading, isRefreshing, actionKey, error, loadAdminData, toggleUserRole, deleteUser, deleteSample } = useAdminStore();
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');

  useEffect(() => { loadAdminData(token); }, []);

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSamples = samples.filter(s =>
    s.sample_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleRole = async (user) => { try { await toggleUserRole(token, user); } catch {} };
  const handleDeleteUser = async (userId) => { try { await deleteUser(token, userId); } catch {} };
  const handleDeleteSample = async (sampleId) => { try { await deleteSample(token, sampleId); } catch {} };

  return (
    <View testID="station-system" style={styles.root}>
      <View style={styles.tabBar}>
        <Pressable testID="tab-users" style={[styles.tab, activeTab === 'users' && styles.tabActive]} onPress={() => setActiveTab('users')}>
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>👥 Users ({users.length})</Text>
        </Pressable>
        <Pressable testID="tab-samples" style={[styles.tab, activeTab === 'samples' && styles.tabActive]} onPress={() => setActiveTab('samples')}>
          <Text style={[styles.tabText, activeTab === 'samples' && styles.tabTextActive]}>🔬 Samples ({samples.length})</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput testID="system-search" style={styles.search} placeholder={`Tìm kiếm ${activeTab === 'users' ? 'người dùng' : 'mẫu vật'}...`} placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} clearButtonMode="while-editing" />
      </View>

      {error && <View style={styles.errorBanner}><Text style={styles.errorText}>⚠️ {error}</Text></View>}

      {isLoading && users.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={C.primaryGlow} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadAdminData(token, true)} tintColor={C.primary} />}>
          {activeTab === 'users' ? (
            filteredUsers.length === 0 ? <Text style={styles.emptyText}>Không tìm thấy người dùng</Text> :
            filteredUsers.map(u => <UserRow key={u.id} user={u} actionKey={actionKey} onToggleRole={handleToggleRole} onDelete={handleDeleteUser} C={C} styles={styles} />)
          ) : (
            filteredSamples.length === 0 ? <Text style={styles.emptyText}>Không tìm thấy mẫu phân tích</Text> :
            filteredSamples.map(s => <SampleRow key={s.id} sample={s} actionKey={actionKey} onDelete={handleDeleteSample} C={C} styles={styles} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
