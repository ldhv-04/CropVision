/**
 * mobileTheme.js — 3 Chế độ tương phản màu sắc tối ưu cho thực địa
 *
 * 1. sunlight: Chế độ Nắng Gắt (Trắng tuyết, viền đen đậm, chữ đen tuyền, chống lóa 12h trưa)
 * 2. dark:     Chế độ Tối OLED (Đen obsidian, xanh neon thực địa, siêu tiết kiệm pin ngoài đồng)
 * 3. natural:  Chế độ Tự Nhiên (Nền xanh nhạt dịu mát, dễ chịu khi xem trong nhà)
 */

export const THEME_MODES = {
  SUNLIGHT: 'sunlight',
  DARK:     'dark',
  NATURAL:  'natural',
};

export const MOBILE_PALETTES = {
  // ☀️ CHẾ ĐỘ NẮNG GẮT: Tương phản đen-trắng tuyệt đối chống chói mắt ngoài nắng
  [THEME_MODES.SUNLIGHT]: {
    name: 'Nắng Gắt',
    icon: '☀️',
    desc: 'Tương phản cực đại chống lóa khi đứng giữa trời nắng',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceCard: '#FFFFFF',
    surfaceElevated: '#E2E8F0',
    border: '#0F172A',
    borderLight: '#94A3B8',
    borderFocus: '#000000',
    
    textPrimary: '#000000',
    textSecondary: '#1E293B',
    textMuted: '#475569',
    
    primary: '#059669',
    primaryBg: '#DCFCE7',
    primaryBorder: '#166534',
    
    accent: '#0284C7',
    accentBg: '#E0F2FE',
    
    warning: '#D97706',
    warningBg: '#FEF3C7',
    warningBorder: '#B45309',
    
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    dangerBorder: '#991B1B',
    
    success: '#16A34A',
    successBg: '#DCFCE7',
    
    polygonFill: 'rgba(5, 150, 105, 0.25)',
    polygonStroke: '#047857',
    polygonSelectedFill: 'rgba(2, 132, 199, 0.35)',
    polygonSelectedStroke: '#0284C7',
    
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#CBD5E1',
    tabBarActive: '#059669',
    tabBarInactive: '#64748B',
  },

  // 🌑 CHẾ ĐỘ TỐI OLED: Tiết kiệm pin tối đa, giảm sinh nhiệt cho điện thoại
  [THEME_MODES.DARK]: {
    name: 'Tối OLED',
    icon: '🌑',
    desc: 'Tiết kiệm pin tối đa & mát máy cả ngày',
    background: '#06090E',
    surface: '#0D1320',
    surfaceCard: '#0D1320',
    surfaceElevated: '#151D2E',
    border: '#1B2537',
    borderLight: '#233047',
    borderFocus: '#00F5A0',
    
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    
    primary: '#00F5A0',
    primaryBg: 'rgba(0, 245, 160, 0.12)',
    primaryBorder: 'rgba(0, 245, 160, 0.35)',
    
    accent: '#00D2FF',
    accentBg: 'rgba(0, 210, 255, 0.12)',
    
    warning: '#FFB300',
    warningBg: 'rgba(255, 179, 0, 0.12)',
    warningBorder: 'rgba(255, 179, 0, 0.4)',
    
    danger: '#FF2E54',
    dangerBg: 'rgba(255, 46, 84, 0.12)',
    dangerBorder: 'rgba(255, 46, 84, 0.4)',
    
    success: '#00F5A0',
    successBg: 'rgba(0, 245, 160, 0.12)',
    
    polygonFill: 'rgba(0, 245, 160, 0.22)',
    polygonStroke: '#00F5A0',
    polygonSelectedFill: 'rgba(0, 210, 255, 0.35)',
    polygonSelectedStroke: '#00D2FF',
    
    tabBarBg: '#06090E',
    tabBarBorder: '#1B2537',
    tabBarActive: '#00F5A0',
    tabBarInactive: '#64748B',
  },

  // 🌿 CHẾ ĐỘ TỰ NHIÊN: Dịu mắt, thanh nhã khi xem trong nhà
  [THEME_MODES.NATURAL]: {
    name: 'Tự Nhiên',
    icon: '🌿',
    desc: 'Sắc xanh nông nghiệp dịu mắt khi ở trong nhà',
    background: '#F4F7F4',
    surface: '#FFFFFF',
    surfaceCard: '#FFFFFF',
    surfaceElevated: '#E8EFE8',
    border: '#D0DDD0',
    borderLight: '#E2EBE2',
    borderFocus: '#2D6A4F',
    
    textPrimary: '#1B4332',
    textSecondary: '#406A52',
    textMuted: '#6B8E77',
    
    primary: '#2D6A4F',
    primaryBg: '#E8F5E9',
    primaryBorder: '#52B788',
    
    accent: '#1D70B8',
    accentBg: '#EBF4FA',
    
    warning: '#D97706',
    warningBg: '#FEF3C7',
    warningBorder: '#F59E0B',
    
    danger: '#B91C1C',
    dangerBg: '#FEE2E2',
    dangerBorder: '#EF4444',
    
    success: '#2D6A4F',
    successBg: '#E8F5E9',
    
    polygonFill: 'rgba(45, 106, 79, 0.22)',
    polygonStroke: '#2D6A4F',
    polygonSelectedFill: 'rgba(29, 112, 184, 0.3)',
    polygonSelectedStroke: '#1D70B8',
    
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#D0DDD0',
    tabBarActive: '#2D6A4F',
    tabBarInactive: '#748C7D',
  },
};

export default MOBILE_PALETTES;
