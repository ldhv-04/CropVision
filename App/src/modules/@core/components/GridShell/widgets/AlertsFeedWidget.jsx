/**
 * AlertsFeedWidget — Live Alert Feed from API
 *
 * Displays real alerts from /api/alerts/all with:
 * - Severity color coding (critical=red pulse, warning=yellow, info=blue)
 * - Relative timestamps
 * - Ack percentage
 * - Link to full alerts management page
 * Theme-aware: uses useTheme() for light/dark mode support.
 */

import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../../auth/useAuthStore';
import { apiRequest } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { useTheme } from '../../../context/ThemeContext';

// Severity semantic colors are constant across themes
const SEVERITY_STYLES = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', icon: '🚨', pulse: true },
  warning:  { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', icon: '⚠️', pulse: false },
  info:     { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.2)', icon: 'ℹ️', pulse: false },
};

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function getStyles(c) {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: c.surface,
      borderRadius: 12,
      border: `1px solid ${c.border}`,
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 16px',
      borderBottom: `1px solid ${c.border}`,
      backgroundColor: `${c.surface}cc`,
    },
    headerIcon: { fontSize: 16 },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      flex: 1,
    },
    headerBadge: {
      backgroundColor: `${c.danger}20`,
      color: c.danger,
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 10,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      padding: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    alertCard: {
      borderRadius: 10,
      padding: '10px 12px',
      cursor: 'default',
      transition: 'transform 0.15s',
    },
    alertRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    alertTitle: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: 700,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    alertTime: {
      color: c.textMuted,
      fontSize: 10,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      whiteSpace: 'nowrap',
    },
    alertMessage: {
      color: c.textSecondary,
      fontSize: 11,
      lineHeight: '15px',
      marginBottom: 6,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    alertMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    progressBar: {
      flex: 1,
      height: 3,
      backgroundColor: `${c.white || '#ffffff'}0d`,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      transition: 'width 0.3s',
    },
    ackText: {
      color: c.textMuted,
      fontSize: 10,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      whiteSpace: 'nowrap',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 32,
      flex: 1,
    },
    emptyText: {
      color: c.textMuted,
      fontSize: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    loadingState: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: 'center',
      padding: 32,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    viewAllBtn: {
      display: 'block',
      width: '100%',
      padding: '10px 0',
      border: 'none',
      borderTop: `1px solid ${c.border}`,
      backgroundColor: 'transparent',
      color: c.primaryGlow,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'background-color 0.15s',
    },
  };
}

export function AlertsFeedWidget() {
  const token = useAuthStore((s) => s.token);
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const styles = getStyles(colors);

  useEffect(() => {
    apiRequest(ENDPOINTS.alerts.all, {}, token)
      .then((data) => {
        if (data.success) setAlerts(data.data.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>📢</span>
          <span style={styles.headerTitle}>Cảnh báo</span>
        </div>
        <div style={styles.loadingState}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>📢</span>
        <span style={styles.headerTitle}>Cảnh báo</span>
        <span style={styles.headerBadge}>{alerts.filter(a => a.is_active).length}</span>
      </div>

      <div style={styles.list}>
        {alerts.length === 0 && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 28 }}>✅</span>
            <span style={styles.emptyText}>Không có cảnh báo</span>
          </div>
        )}

        {alerts.map((alert) => {
          const sv = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
          const ackPercent = alert.total_users > 0
            ? Math.round((parseInt(alert.ack_count, 10) / parseInt(alert.total_users, 10)) * 100)
            : 0;

          return (
            <div
              key={alert.id}
              style={{
                ...styles.alertCard,
                backgroundColor: sv.bg,
                borderLeft: `3px solid ${sv.color}`,
                opacity: alert.is_active ? 1 : 0.5,
              }}
            >
              <div style={styles.alertRow}>
                <span style={{ fontSize: 14 }}>{sv.icon}</span>
                <span style={styles.alertTitle}>{alert.title}</span>
                <span style={styles.alertTime}>{timeAgo(alert.created_at)}</span>
              </div>
              <div style={styles.alertMessage}>{alert.message}</div>
              <div style={styles.alertMeta}>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${ackPercent}%`, backgroundColor: sv.color }} />
                </div>
                <span style={styles.ackText}>{ackPercent}% đã xem</span>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <button
          style={styles.viewAllBtn}
          onClick={() => router.push('/alerts')}
        >
          Quản lý cảnh báo →
        </button>
      )}
    </div>
  );
}