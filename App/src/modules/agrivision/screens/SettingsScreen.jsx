import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import api, { API_BASE_URL } from '../../@core/api/apiClient';

const C = LIGHT_COLORS;

export default function SettingsScreen() {
  const user = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inference/samples');
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => {
    const imageUrl = item.image_url ? `${API_BASE_URL}${item.image_url}` : null;
    const date = new Date(item.created_at).toLocaleDateString('vi-VN');
    
    // Attempt to extract top crop and disease
    const detections = item.boxes || [];
    const topDetection = detections.length > 0 ? detections[0] : null;

    return (
      <View style={styles.historyCard}>
        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.historyImage} />}
        <View style={styles.historyInfo}>
          <Text style={styles.historyDate}>{date}</Text>
          <Text style={styles.historyTitle} numberOfLines={1}>
            {topDetection ? topDetection.class_name : 'Không rõ bệnh'}
          </Text>
          <Text style={styles.historySubtitle}>Mức độ tự tin: {topDetection ? Math.round(topDetection.confidence * 100) + '%' : '--'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>
        <Pressable style={styles.logoutBtn} onPress={clearAuth}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Lịch sử chẩn đoán</Text>
      
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />
      ) : history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Chưa có lịch sử chẩn đoán.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id.toString()}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.historyList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${C.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: C.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: C.textPrimary,
  },
  profileEmail: {
    fontSize: FONT_SIZE.sm,
    color: C.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: C.textPrimary,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  historyList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  historyImage: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: C.background,
  },
  historyInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
  },
  historyDate: {
    fontSize: FONT_SIZE.xs,
    color: C.textMuted,
  },
  historyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: C.textPrimary,
    marginVertical: 2,
  },
  historySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: C.textSecondary,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: C.textMuted,
    fontSize: FONT_SIZE.md,
  }
});
