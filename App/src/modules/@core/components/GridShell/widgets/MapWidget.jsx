/**
 * MapWidget — Leaflet Map with Vietnam Province Boundaries
 *
 * Features:
 * - OpenStreetMap tiles with clear boundaries
 * - Vietnam province boundary overlay (GADM GeoJSON)
 * - Scan location markers (color-coded by severity)
 * - Click marker → popup with scan details
 * - State management moved to useMapStore (Epoch 2)
 * Theme-aware: uses useTheme() for light/dark mode support.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../auth/useAuthStore';
import { useTheme } from '../../../context/ThemeContext';
import { useSubZoneStore } from '../../../../agrivision/store/useSubZoneStore';
import { useMapStore } from '../../../store/useMapStore';

const SEVERITY_COLORS = {
  severe: '#ef4444',
  moderate: '#f59e0b',
  mild: '#4ade80',
};

function getStyles(c) {
  return {
    container: {
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      border: `1px solid ${c.border}`,
    },
    map: {
      width: '100%',
      height: '100%',
      background: c.surface,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: c.surface,
      zIndex: 1000,
    },
    loadingText: {
      color: c.textMuted,
      fontSize: 13,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    legend: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      background: `${c.surface}e6`,
      borderRadius: 10,
      padding: '8px 12px',
      display: 'flex',
      gap: 12,
      zIndex: 1000,
      border: `1px solid ${c.border}`,
      backdropFilter: 'blur(8px)',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      boxShadow: '0 0 6px rgba(0,0,0,0.3)',
    },
    legendLabel: {
      color: c.textSecondary,
      fontSize: 10,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 600,
    },
  };
}

export function MapWidget() {
  const token = useAuthStore((s) => s.token);
  const { colors } = useTheme();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);
  const outbreaksLayerRef = useRef(null);
  const simulationLayerRef = useRef(null);
  const affectedLayerRef = useRef(null);

  const { outbreaks, selectedOutbreak, simulationResult } = useSubZoneStore();
  const { activeLayers, mapData, fetchMapData, timelineFilter, setSelectedFeature } = useMapStore();
  const styles = getStyles(colors);

  useEffect(() => {
    if (token) {
      fetchMapData(token);
    }
  }, [token, fetchMapData]);

  // Reactive layer updates for outbreaks and simulation cones
  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // ── 1. Update Outbreaks Layer ──
    if (outbreaksLayerRef.current) {
      outbreaksLayerRef.current.clearLayers();

      if (activeLayers.includes('outbreaks')) {
        outbreaks.forEach((o) => {
          const boundary = typeof o.boundary === 'string' ? JSON.parse(o.boundary) : o.boundary;
          if (boundary && boundary.coordinates) {
            const latlngs = boundary.coordinates[0].map(([lng, lat]) => [lat, lng]);

            // Draw the infected subzone boundary
            const poly = L.polygon(latlngs, {
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.35,
              weight: 3.5,
              className: 'outbreak-infected-poly'
            }).addTo(outbreaksLayerRef.current);

            poly.on('click', () => {
              setSelectedFeature({ type: 'outbreak', data: o });
            });

            poly.bindTooltip(`<div style="font-family:system-ui;font-weight:700;color:#991b1b;">⚠️ Dịch bệnh: ${o.disease_type?.replace(/_/g, ' ')}</div>`, {
              permanent: true,
              direction: 'center',
              className: 'outbreak-tooltip'
            });

            // Place warning marker head at centroid
            const bounds = poly.getBounds();
            const centroid = bounds.getCenter();
            const warningIcon = L.divIcon({
              className: 'warning-marker',
              html: `<div style="
                width: 24px; height: 24px; border-radius: 50%;
                background: #ef4444; border: 2px solid #fff;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
                display: flex; align-items: center; justify-content: center;
                font-size: 13px; font-weight: bold; color: #fff;
                animation: pulse 1.8s infinite;
              ">🚨</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const centroidMarker = L.marker(centroid, { icon: warningIcon }).addTo(outbreaksLayerRef.current);
            centroidMarker.on('click', () => {
              setSelectedFeature({ type: 'outbreak', data: o });
            });
          }
        });
      }
    }

    // ── 2. Update Simulation Cone Layer ──
    if (simulationLayerRef.current) {
      simulationLayerRef.current.clearLayers();

      if (activeLayers.includes('simulations') && simulationResult && simulationResult.simulationCone) {
        const cone = simulationResult.simulationCone;
        if (cone.geometry && cone.geometry.coordinates) {
          const latlngs = cone.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);

          const conePoly = L.polygon(latlngs, {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.18,
            weight: 2,
            dashArray: '5, 8',
          }).addTo(simulationLayerRef.current);

          // Fit bounds to show the full simulation area
          map.fitBounds(conePoly.getBounds(), { padding: [40, 40] });
        }
      }
    }

    // ── 3. Update Affected Zones Layer ──
    if (affectedLayerRef.current) {
      affectedLayerRef.current.clearLayers();

      // If simulation is active and has affectedZoneIds, highlight them
      if (activeLayers.includes('simulations') && simulationResult && simulationResult.affectedZoneIds && selectedOutbreak && selectedOutbreak.affectedZones) {
        const affectedZones = selectedOutbreak.affectedZones;

        affectedZones.forEach((z) => {
          // Verify if this zone is in the affected list
          if (simulationResult.affectedZoneIds.includes(z.zone_id)) {
            const boundary = typeof z.boundary === 'string' ? JSON.parse(z.boundary) : z.boundary;
            if (boundary && boundary.coordinates) {
              const latlngs = boundary.coordinates[0].map(([lng, lat]) => [lat, lng]);

              const poly = L.polygon(latlngs, {
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.3,
                weight: 2.5,
                dashArray: '3, 5',
              }).addTo(affectedLayerRef.current);

              poly.bindTooltip(`<div style="font-family:system-ui;font-weight:600;color:#92400e;">⚠️ Đe dọa: Cây ${z.crop_type}</div>`, {
                permanent: false,
                direction: 'center'
              });
            }
          }
        });
      }
    }
  }, [outbreaks, selectedOutbreak, simulationResult, activeLayers, setSelectedFeature]);

  // Reactive layer update for scans
  useEffect(() => {
    const L = window.L;
    if (!L || !markersRef.current) return;
    
    markersRef.current.clearLayers();
    
    if (activeLayers.includes('scans') && mapData.scans) {
      const now = new Date();
      let cutoffDate = null;
      if (timelineFilter === '7d') cutoffDate = new Date(now.setDate(now.getDate() - 7));
      else if (timelineFilter === '1m') cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
      else if (timelineFilter === '3m') cutoffDate = new Date(now.setMonth(now.getMonth() - 3));

      const filteredScans = cutoffDate 
        ? mapData.scans.filter(s => new Date(s.created_at) >= cutoffDate)
        : mapData.scans;

      filteredScans.forEach((scan) => {
        if (!scan.latitude || !scan.longitude) return;

        const detections = scan.detections || [];
        const hasDisease = detections.some(d => !d.disease_class?.includes('Healthy'));
        const severity = detections.find(d => d.disease_class?.includes('Late_blight') || d.disease_class?.includes('severe'))
          ? 'severe' : hasDisease ? 'moderate' : 'mild';
        const color = SEVERITY_COLORS[severity];

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 10px; height: 10px; border-radius: 50%;
            background: ${color}; border: 2px solid ${color}80;
            box-shadow: 0 0 8px ${color}60;
          "></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });

        const marker = L.marker([parseFloat(scan.latitude), parseFloat(scan.longitude)], { icon })
          .addTo(markersRef.current);

        // Click event to open Detail Drawer instead of HTML popup
        marker.on('click', () => {
          setSelectedFeature({ type: 'scan', data: scan });
        });
      });
    }
  }, [mapData.scans, activeLayers, timelineFilter, setSelectedFeature]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const loadMap = async () => {
      // Inject Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject custom styling tags
      if (!document.getElementById('map-widget-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'map-widget-custom-styles';
        style.innerHTML = `
          @keyframes pulse {
            0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          .outbreak-tooltip {
            background-color: rgba(254, 226, 226, 0.9) !important;
            border: 1.5px solid #f87171 !important;
            border-radius: 6px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      if (!mapRef.current || mapInstanceRef.current) return;

      // Initialize map centered on Vietnam
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([14.0583, 108.2772], 6);
      mapInstanceRef.current = map;

      // OpenStreetMap tiles (clear boundaries)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      // Attribution
      L.control.attribution({ prefix: false }).addAttribution('© OpenStreetMap contributors').addTo(map);

      // Marker layer group
      const markersLayer = L.layerGroup().addTo(map);
      markersRef.current = markersLayer;

      // Layer groups for geo-epidemic module
      const outbreaksLayer = L.layerGroup().addTo(map);
      outbreaksLayerRef.current = outbreaksLayer;

      const simulationLayer = L.layerGroup().addTo(map);
      simulationLayerRef.current = simulationLayer;

      const affectedLayer = L.layerGroup().addTo(map);
      affectedLayerRef.current = affectedLayer;
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div ref={mapRef} style={styles.map} />
      {mapData.loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingText}>🗺️ Đang tải bản đồ...</div>
        </div>
      )}
      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: SEVERITY_COLORS.severe }} />
          <span style={styles.legendLabel}>Nghiêm trọng</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: SEVERITY_COLORS.moderate }} />
          <span style={styles.legendLabel}>Trung bình</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: SEVERITY_COLORS.mild }} />
          <span style={styles.legendLabel}>Khỏe mạnh</span>
        </div>
      </div>
    </div>
  );
}