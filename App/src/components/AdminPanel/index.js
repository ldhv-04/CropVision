import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Platform, useWindowDimensions } from 'react-native';
import { COLORS } from '../../constants/theme';
import styles from './styles';
import { buildApiUrl } from '../../config/api';
const FIXED_ADMIN_EMAIL = 'admin@cropvision.local';

const formatDate = (value) => {
  if (!value) return 'Chua co du lieu';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatConfidence = (value) => {
  const numericValue = parseFloat(value);
  if (Number.isNaN(numericValue)) return 'Chua co';
  return `${(numericValue * 100).toFixed(1)}%`;
};

export default function AdminPanel({ authToken, currentUser }) {
  const { width } = useWindowDimensions();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState(null);

  const isCompactLayout = width < 960;
  const summaryCardWidth = isCompactLayout ? '100%' : '23%';

  // Xac nhan thao tac nguy hiem theo cach tuong thich desktop/web va native.
  const requestConfirmation = (title, message) => new Promise((resolve) => {
    if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
      resolve(globalThis.confirm(`${title}\n\n${message}`));
      return;
    }

    Alert.alert(title, message, [
      { text: 'Huy', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Dong y', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });

  // Goi API admin co kem Bearer token.
  const adminFetch = async (endpoint, options = {}) => {
    const response = await fetch(buildApiUrl(`/api/admin${endpoint}`), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Khong the thuc hien yeu cau admin.');
    }

    return data;
  };

  // Tai dong thoi summary, users va samples cho khu vuc admin.
  const loadAdminData = async (useRefreshState = false) => {
    if (!authToken) return;

    if (useRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [summaryResponse, usersResponse, samplesResponse] = await Promise.all([
        adminFetch('/summary'),
        adminFetch('/users'),
        adminFetch('/samples'),
      ]);

      setSummary(summaryResponse.data);
      setUsers(usersResponse.data);
      setSamples(samplesResponse.data);
    } catch (error) {
      Alert.alert('Loi admin', error.message);
    } finally {
      if (useRefreshState) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [authToken]);

  // Doi role user <-> admin, nhung giu nguyen admin co dinh.
  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    setActionKey(`role-${user.id}`);

    try {
      await adminFetch(`/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      await loadAdminData(true);
    } catch (error) {
      Alert.alert('Cap nhat role that bai', error.message);
    } finally {
      setActionKey(null);
    }
  };

  // Xoa user khoi he thong sau khi admin xac nhan.
  const handleDeleteUser = async (user) => {
    const confirmed = await requestConfirmation(
      'Xoa nguoi dung',
      `Ban co chac muon xoa tai khoan ${user.email}?`
    );

    if (!confirmed) {
      return;
    }

    setActionKey(`delete-user-${user.id}`);
    try {
      await adminFetch(`/users/${user.id}`, { method: 'DELETE' });
      await loadAdminData(true);
    } catch (error) {
      Alert.alert('Xoa user that bai', error.message);
    } finally {
      setActionKey(null);
    }
  };

  // Xoa sample va file anh lien quan sau khi admin xac nhan.
  const handleDeleteSample = async (sample) => {
    const confirmed = await requestConfirmation(
      'Xoa mau vat',
      `Ban co chac muon xoa mau ${sample.sample_name}?`
    );

    if (!confirmed) {
      return;
    }

    setActionKey(`delete-sample-${sample.id}`);
    try {
      await adminFetch(`/samples/${sample.id}`, { method: 'DELETE' });
      await loadAdminData(true);
    } catch (error) {
      Alert.alert('Xoa mau that bai', error.message);
    } finally {
      setActionKey(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.toolbarSubTitle}>Dang tai du lieu quan tri...</Text>
      </View>
    );
  }

  const summaryCards = [
    { label: 'Tong nguoi dung', value: summary?.total_users ?? 0 },
    { label: 'Tai khoan admin', value: summary?.total_admins ?? 0 },
    { label: 'Tong mau vat', value: summary?.total_samples ?? 0 },
    { label: 'Tong detection', value: summary?.total_detections ?? 0 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={[styles.toolbar, isCompactLayout && { alignItems: 'flex-start', flexDirection: 'column' }]}>
        <View>
          <Text style={styles.toolbarTitle}>Bang quan tri admin</Text>
          <Text style={styles.toolbarSubTitle}>
            Quan ly role, nguoi dung va du lieu phan tich cho {currentUser?.email}
          </Text>
        </View>
        <Pressable
          style={[styles.refreshBtn, isCompactLayout && { marginTop: 12 }]}
          onPress={() => loadAdminData(true)}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshText}>{isRefreshing ? 'Dang tai...' : 'Lam moi'}</Text>
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <View key={card.label} style={[styles.summaryCard, { width: summaryCardWidth }]}>
            <Text style={styles.summaryLabel}>{card.label}</Text>
            <Text style={styles.summaryValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panelCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quan ly nguoi dung</Text>
          <Text style={styles.sectionMeta}>{users.length} tai khoan</Text>
        </View>

        {users.length === 0 ? (
          <Text style={styles.emptyText}>Chua co nguoi dung nao trong he thong.</Text>
        ) : (
          users.map((user) => {
            const isFixedAdmin = user.email === FIXED_ADMIN_EMAIL;
            return (
              <View key={user.id} style={styles.row}>
                <View style={[styles.rowHeader, isCompactLayout && { flexDirection: 'column' }]}>
                  <View>
                    <Text style={styles.rowTitle}>{user.full_name}</Text>
                    <Text style={styles.rowSubTitle}>{user.email}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: user.role === 'admin' ? COLORS.primary : COLORS.border }, isCompactLayout && { marginTop: 10, alignSelf: 'flex-start' }]}>
                    <Text style={styles.badgeText}>{user.role}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>Xac thuc: {user.is_verified ? 'Da xac thuc' : 'Chua xac thuc'}</Text>
                  <Text style={styles.metaText}>Mau vat: {user.sample_count}</Text>
                  <Text style={styles.metaText}>Tao luc: {formatDate(user.created_at)}</Text>
                </View>

                <View style={[styles.actionRow, isCompactLayout && { flexDirection: 'column' }]}>
                  <Pressable
                    style={[styles.actionBtn, isFixedAdmin ? styles.mutedAction : styles.primaryAction, isCompactLayout && { marginRight: 0, marginBottom: 10 }]}
                    onPress={() => handleToggleRole(user)}
                    disabled={isFixedAdmin || actionKey === `role-${user.id}`}
                  >
                    <Text style={styles.actionText}>
                      {actionKey === `role-${user.id}` ? 'Dang cap nhat...' : user.role === 'admin' ? 'Ha quyen ve user' : 'Nang quyen admin'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, isFixedAdmin ? styles.mutedAction : styles.dangerAction]}
                    onPress={() => handleDeleteUser(user)}
                    disabled={isFixedAdmin || actionKey === `delete-user-${user.id}`}
                  >
                    <Text style={styles.actionText}>
                      {actionKey === `delete-user-${user.id}` ? 'Dang xoa...' : 'Xoa tai khoan'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.panelCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quan ly mau vat</Text>
          <Text style={styles.sectionMeta}>{samples.length} ban ghi</Text>
        </View>

        {samples.length === 0 ? (
          <Text style={styles.emptyText}>Chua co mau vat nao de quan ly.</Text>
        ) : (
          samples.map((sample) => (
              <View key={sample.id} style={styles.row}>
              <View style={[styles.rowHeader, isCompactLayout && { flexDirection: 'column' }]}>
                <View>
                  <Text style={styles.rowTitle}>{sample.sample_name}</Text>
                  <Text style={styles.rowSubTitle}>{sample.owner_email || 'Khong gan user'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: COLORS.secondary }, isCompactLayout && { marginTop: 10, alignSelf: 'flex-start' }]}>
                  <Text style={styles.badgeText}>{sample.detection_count} detections</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Top confidence: {formatConfidence(sample.top_confidence)}</Text>
                <Text style={styles.metaText}>Dung luong: {sample.file_size || 0} bytes</Text>
                <Text style={styles.metaText}>Tao luc: {formatDate(sample.created_at)}</Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, styles.dangerAction]}
                  onPress={() => handleDeleteSample(sample)}
                  disabled={actionKey === `delete-sample-${sample.id}`}
                >
                  <Text style={styles.actionText}>
                    {actionKey === `delete-sample-${sample.id}` ? 'Dang xoa...' : 'Xoa mau vat'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
