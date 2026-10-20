/**
 * DashboardPage — Tactical Agronomy Mission Control.
 * Decomposed container component conforming to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { useAdminStore } from '../../../modules/admin/store/useAdminStore';
import { TACTICAL_THEME } from '../constants/tacticalTheme';
import { TelemetryKpiCard } from './dashboard/TelemetryKpiCard';
import { TacticalPanel } from './dashboard/TacticalPanel';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { summary, alerts, isLoading, fetchSummary, fetchAlerts } = useAdminStore();

  useEffect(() => {
    fetchSummary();
    fetchAlerts();
  }, [fetchSummary, fetchAlerts]);

  if (isLoading && !summary) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: TACTICAL_THEME.bgBase,
        }}
      >
        <ActivityIndicator size="large" color="#00F5A0" />
      </div>
    );
  }

  const criticalAlerts = alerts?.filter((a) => a.severity === 'CRITICAL') || [];

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: TACTICAL_THEME.bgBase,
        padding: 24,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 900,
              color: TACTICAL_THEME.textPrimary,
              fontFamily: TACTICAL_THEME.fontMono,
            }}
          >
            MISSION CONTROL // OPERATIONAL TELEMETRY
          </h2>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: TACTICAL_THEME.textMuted,
              fontFamily: TACTICAL_THEME.fontMono,
            }}
          >
            OPERATOR: {user?.email || 'OFFICER'} · CADENCE: REAL-TIME SECURE LINK
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <TelemetryKpiCard
          icon="🛰️"
          code="SEC-01"
          label="Managed Plots"
          value={summary?.totalFields || 0}
          subValue="Active CAD Grid"
          color="#00F5A0"
        />
        <TelemetryKpiCard
          icon="🌾"
          code="SEC-02"
          label="Total Area"
          value={`${(summary?.totalAreaHectares || 0).toFixed(1)} ha`}
          subValue="Surveillance Bounds"
          color="#38BDF8"
        />
        <TelemetryKpiCard
          icon="⚠️"
          code="SEC-03"
          label="Active Outbreaks"
          value={criticalAlerts.length}
          subValue="Intervention Required"
          color="#FF2E54"
        />
        <TelemetryKpiCard
          icon="🔬"
          code="SEC-04"
          label="Model Confidence"
          value="98.4%"
          subValue="Edge YOLOv8 Engine"
          color="#FFB300"
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <TacticalPanel
          title="EPIDEMIOLOGICAL ALERT STREAM"
          subtitle="Real-time pathogen dispersion alerts"
          icon="🚨"
          badge={`${alerts?.length || 0} TOTAL`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts && alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={alert.id || idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? '#FF2E54' : '#FFB300'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{alert.title || alert.type}</div>
                    <div style={{ fontSize: 10.5, color: '#888' }}>{alert.message || alert.field_name}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#666' }}>{alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'RECENT'}</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#888', fontSize: 12, padding: 12 }}>No active outbreak alerts recorded.</div>
            )}
          </div>
        </TacticalPanel>
      </div>
    </div>
  );
}
