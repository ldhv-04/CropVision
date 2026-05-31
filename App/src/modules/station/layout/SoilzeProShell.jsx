/**
 * SoilzePro Shell — Main Application Layout
 *
 * Matches SoilzePro's Global Application Shell:
 * - Left Sidebar (260px) with navigation
 * - Top Header (64px) with search, notifications, user profile
 * - Content Area (rest of viewport)
 *
 * Source of truth: soilzepro-research/markdown-wireframes.md
 */

import { useTheme } from '../../@core/context/ThemeContext';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export function SoilzeProShell({ children, activeRoute, onNavigate }) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  const shellStyle = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: colors.background,
    fontFamily: '"Inter", "Outfit", system-ui, -apple-system, sans-serif',
  };

  const mainAreaStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: 0,
    minHeight: 0,
  };

  return (
    <div style={shellStyle} data-testid="soilzepro-shell">
      {/* Left Sidebar */}
      <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />

      {/* Main Area: Header + Content */}
      <div style={mainAreaStyle}>
        <TopHeader activeRoute={activeRoute} />
        <div style={contentStyle} data-testid="soilzepro-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default SoilzeProShell;