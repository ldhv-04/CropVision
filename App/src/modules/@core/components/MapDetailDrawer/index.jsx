/**
 * @deprecated Frozen MapShell compatibility child. Canonical Station uses
 * SoilzeProShell + <Slot />; do not add new consumers or move/delete this file
 * without a separately approved plan.
 */
import { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useTheme } from '../../context/ThemeContext';
import { SHADOWS } from '../../constants/theme';

export function MapDetailDrawer() {
  const selectedFeature = useMapStore((state) => state.selectedFeature);
  const setSelectedFeature = useMapStore((state) => state.setSelectedFeature);
  const { colors } = useTheme();
  
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' or 'analytics'

  const drawerStyle = {
    position: 'absolute',
    top: 96,
    right: selectedFeature ? 16 : -400,
    bottom: 16,
    width: 320,
    zIndex: 30, // OVERLAYS_DRAWERS
    backgroundColor: colors.surface,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    boxShadow: SHADOWS.card,
    overflow: 'hidden',
    transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${colors.surfaceMuted}40`,
  };

  const titleStyle = {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
    margin: 0,
  };

  const closeBtnStyle = {
    background: 'transparent',
    border: 'none',
    color: colors.textSecondary,
    cursor: 'pointer',
    fontSize: 20,
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const tabsContainerStyle = {
    display: 'flex',
    borderBottom: `1px solid ${colors.border}`,
    padding: '0 8px',
  };

  const getTabStyle = (isActive) => ({
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${isActive ? colors.primary : 'transparent'}`,
    color: isActive ? colors.primary : colors.textSecondary,
    fontWeight: isActive ? 600 : 500,
    fontSize: 14,
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.2s',
  });

  const contentStyle = {
    padding: 20,
    flex: 1,
    overflowY: 'auto',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 1.5,
  };

  return (
    <div style={drawerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {selectedFeature?.title || selectedFeature?.name || 'Chi tiết khu vực'}
        </h3>
        <button 
          onClick={() => setSelectedFeature(null)} 
          style={closeBtnStyle}
        >
          ✕
        </button>
      </div>

      <div style={tabsContainerStyle}>
        <button 
          style={getTabStyle(activeTab === 'telemetry')}
          onClick={() => setActiveTab('telemetry')}
        >
          Cảm biến
        </button>
        <button 
          style={getTabStyle(activeTab === 'analytics')}
          onClick={() => setActiveTab('analytics')}
        >
          Phân tích
        </button>
      </div>

      <div style={contentStyle}>
        {selectedFeature ? (
          <div>
            <p style={{ marginBottom: 16 }}>
              <strong>Tọa độ:</strong> {selectedFeature.lat?.toFixed(4)}, {selectedFeature.lng?.toFixed(4)}
            </p>
            
            {activeTab === 'telemetry' && (
              <div style={{ backgroundColor: colors.background, padding: 12, borderRadius: 8 }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Nhiệt độ:</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>28.5°C</span>
                </div>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Độ ẩm đất:</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>64%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>pH đất:</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>6.2</span>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div style={{ backgroundColor: colors.background, padding: 12, borderRadius: 8 }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Nguy cơ dịch bệnh:</span>
                  <span style={{ color: colors.warning, fontWeight: 600 }}>Trung bình</span>
                </div>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Chỉ số NDVI:</span>
                  <span style={{ color: colors.success, fontWeight: 600 }}>0.72</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phát hiện (AI):</span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>Đốm lá (12%)</span>
                </div>
              </div>
            )}
            
            {selectedFeature.description && (
              <p style={{ marginTop: 16 }}>{selectedFeature.description}</p>
            )}
          </div>
        ) : (
          <p>Chưa chọn khu vực nào.</p>
        )}
      </div>
    </div>
  );
}
