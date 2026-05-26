/**
 * AlertsFeedWidget — Agricultural Alerts & Actionable Feed
 *
 * Displays a chronological feed of system alerts with:
 *   - Severity level badge (Critical / Warning / Info)
 *   - Alert title + descriptive message
 *   - Timestamp (relative)
 *   - Actionable button linking to relevant page or triggering action
 *
 * Data: Mock alerts + enriched from useInferenceStore detections.
 * Integration: Replace with /api/alerts WebSocket or polling endpoint.
 */

import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useInferenceStore } from '../../../../inference/store/useInferenceStore';

const BASE_ALERTS = [
  {
    id: 'a1',
    severity: 'warning',
    title: 'Ẩm độ thấp – Khu B2',
    message: 'Cảm biến S05 ghi nhận ẩm độ xuống 55%, dưới ngưỡng tối thiểu 60% cho dưa hấu.',
    time: '5 phút trước',
    action: { label: 'Xem bản đồ', href: '/dashboard' },
  },
  {
    id: 'a2',
    severity: 'critical',
    title: 'Pin cảm biến S02 sắp hết',
    message: 'Pin cảm biến A2 còn 23%. Cần thay pin trong 2 ngày để tránh mất dữ liệu.',
    time: '12 phút trước',
    action: { label: 'Xem cảm biến', href: '/dashboard' },
  },
  {
    id: 'a3',
    severity: 'info',
    title: 'Lịch phun thuốc – Khu A3',
    message: 'Chu kỳ phun thuốc phòng ngừa 14 ngày cho cà chua sẽ kết thúc vào ngày mai.',
    time: '1 giờ trước',
    action: { label: 'Tư vấn AI', href: '/inference' },
  },
  {
    id: 'a4',
    severity: 'info',
    title: 'Cập nhật mô hình AI',
    message: 'Mô hình YOLOv8 phát hiện bệnh phiên bản v2.4 đã sẵn sàng. Độ chính xác tăng 3.2%.',
    time: '3 giờ trước',
    action: null,
  },
];

const SEVERITY_CONFIG = {
  critical: {
    label: '🚨 Nghiêm trọng',
    bgKey: 'dangerBg', colorKey: 'danger', borderKey: 'dangerBorder',
    dotColor: '#ef4444',
  },
  warning: {
    label: '⚠️ Cảnh báo',
    bgKey: 'warningBg', colorKey: 'warning', borderKey: 'warningBorder',
    dotColor: '#f59e0b',
  },
  info: {
    label: 'ℹ️ Thông tin',
    bgKey: 'infoBg', colorKey: 'info', borderKey: 'border',
    dotColor: '#38bdf8',
  },
};

function AlertCard({ alert, colors, onDismiss }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 12,
      border: `1px solid ${colors[cfg.borderKey]}`,
      backgroundColor: colors[cfg.bgKey],
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
      transition: 'opacity 0.2s',
    }}>
      {/* Severity + time row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: colors[cfg.colorKey],
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: cfg.dotColor,
            boxShadow: `0 0 6px ${cfg.dotColor}`,
            animation: alert.severity === 'critical' ? 'pulse 1.5s infinite' : 'none',
          }} />
          {cfg.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: colors.textMuted }}>{alert.time}</span>
          <button
            onClick={() => onDismiss(alert.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.textMuted, fontSize: 13, padding: 0, lineHeight: 1,
            }}
            title="Bỏ qua"
          >
            ×
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>
        {alert.title}
      </div>

      {/* Message */}
      <div style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.5 }}>
        {alert.message}
      </div>

      {/* Action button */}
      {alert.action && (
        <button
          onClick={() => router.push(alert.action.href)}
          style={{
            alignSelf: 'flex-start',
            padding: '4px 12px', borderRadius: 20,
            border: `1px solid ${colors[cfg.colorKey]}`,
            backgroundColor: `${colors[cfg.colorKey]}18`,
            color: colors[cfg.colorKey],
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {alert.action.label} →
        </button>
      )}
    </div>
  );
}

export function AlertsFeedWidget() {
  const { colors }     = useTheme();
  const { detections } = useInferenceStore();
  const [dismissed, setDismissed] = useState(new Set());

  // Inject dynamic alert from YOLO detections
  const dynamicAlerts = useMemo(() => {
    if (!detections?.length) return [];
    const highRisk = detections.filter((d) => d.confidence >= 0.6);
    if (!highRisk.length) return [];
    return [{
      id: 'yolo-live',
      severity: 'critical',
      title: `Phát hiện ${highRisk.length} bệnh độ tin cậy cao`,
      message: `YOLOv8 phát hiện: ${highRisk.slice(0, 2).map((d) =>
        `${d.class_name} (${(d.confidence * 100).toFixed(0)}%)`
      ).join(', ')}${highRisk.length > 2 ? ' và thêm...' : ''}. Khuyến nghị tư vấn AI ngay.`,
      time: 'Vừa xong',
      action: { label: 'Tư vấn AI ngay', href: '/inference' },
    }];
  }, [detections]);

  const allAlerts = [...dynamicAlerts, ...BASE_ALERTS]
    .filter((a) => !dismissed.has(a.id));

  const onDismiss = (id) => setDismissed((prev) => new Set([...prev, id]));

  const criticalCount = allAlerts.filter((a) => a.severity === 'critical').length;

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: colors.surface, boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px 8px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
            🔔 Cảnh báo & Hành động
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary }}>
            {allAlerts.length} thông báo chưa xử lý
          </div>
        </div>
        {criticalCount > 0 && (
          <div style={{
            padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            backgroundColor: colors.dangerBg, color: colors.danger,
            border: `1px solid ${colors.dangerBorder}`,
            animation: 'pulse 2s infinite',
          }}>
            🚨 {criticalCount} nghiêm trọng
          </div>
        )}
      </div>

      {/* Alert list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 10,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {allAlerts.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: colors.textMuted, fontSize: 13, textAlign: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 32 }}>✅</span>
            <div>Không có cảnh báo nào</div>
            <div style={{ fontSize: 11 }}>Hệ thống đang hoạt động bình thường</div>
          </div>
        ) : (
          allAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              colors={colors}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
