/**
 * @deprecated Frozen MapShell compatibility child. Canonical Station uses
 * SoilzeProShell + <Slot />; do not add new consumers or move/delete this file
 * without a separately approved plan.
 */
import { useMapStore } from '../../store/useMapStore';
import { useTheme } from '../../context/ThemeContext';
import { SHADOWS } from '../../constants/theme';

export function TimelineScrubber() {
  const { colors } = useTheme();
  const timelineFilter = useMapStore((state) => state.timelineFilter);
  const setTimelineFilter = useMapStore((state) => state.setTimelineFilter);

  // We could have options like: 1 week, 1 month, 3 months, All
  const options = [
    { label: '1 Tuần', value: '7d' },
    { label: '1 Tháng', value: '1m' },
    { label: '3 Tháng', value: '3m' },
    { label: 'Tất cả', value: 'all' },
  ];

  const containerStyle = {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10, // MAP_CONTROLS
    backgroundColor: colors.surface,
    padding: '8px 12px',
    borderRadius: 24,
    border: `1px solid ${colors.border}`,
    boxShadow: SHADOWS.card,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const getOptionStyle = (isActive) => ({
    padding: '6px 16px',
    borderRadius: 16,
    border: 'none',
    backgroundColor: isActive ? colors.primary : 'transparent',
    color: isActive ? '#fff' : colors.textSecondary,
    fontWeight: isActive ? 600 : 500,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  // Default to 'all' if no filter is set
  const currentFilter = timelineFilter || 'all';

  return (
    <div style={containerStyle}>
      <span style={{ fontSize: 13, color: colors.textMuted, marginRight: 8, fontWeight: 500 }}>
        Thời gian:
      </span>
      {options.map((opt) => (
        <button
          key={opt.value}
          style={getOptionStyle(currentFilter === opt.value)}
          onClick={() => setTimelineFilter(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
