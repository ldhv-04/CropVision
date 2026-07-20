/**
 * PolygonFieldMap — Mobile Polygon-only Zone Map
 *
 * Renders field boundary and management zones as SVG polygons.
 * This component intentionally renders polygon-only field maps for mobile performance.
 * Do NOT import MapLibre or satellite tile renderers here.
 *
 * Uses react-native-svg for lightweight rendering.
 * Geometry is normalized into local SVG space — this is a field diagram, not a navigational map.
 *
 * @module PolygonFieldMap
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { buildFieldMapSvg } from '../utils/geoToSvg';

// Zone color palette — subtle fills for zones
const ZONE_COLORS = [
  'rgba(76, 175, 80, 0.35)',
  'rgba(33, 150, 243, 0.35)',
  'rgba(255, 152, 0, 0.35)',
  'rgba(156, 39, 176, 0.35)',
  'rgba(0, 188, 212, 0.35)',
  'rgba(255, 87, 34, 0.35)',
  'rgba(121, 85, 72, 0.35)',
  'rgba(63, 81, 181, 0.35)',
];

const ZONE_STROKE_COLORS = [
  '#388E3C',
  '#1976D2',
  '#F57C00',
  '#7B1FA2',
  '#00838F',
  '#D84315',
  '#4E342E',
  '#283593',
];

const SELECTED_COLOR = 'rgba(255, 193, 7, 0.5)';
const SELECTED_STROKE = '#FF8F00';

export default function PolygonFieldMap({
  boundary,
  zones = [],
  selectedZoneId = null,
  onZonePress,
  height = 280,
}) {
  const svgWidth = 340;
  const svgHeight = height;

  // Memoize SVG geometry computation
  const svgData = useMemo(() => {
    if (!boundary && (!zones || zones.length === 0)) return null;
    const data = buildFieldMapSvg(zones, boundary, svgWidth, svgHeight, 20);

    return data;
  }, [boundary, zones, selectedZoneId, svgWidth, svgHeight]);

  if (!svgData || !svgData.valid) {
    return (
      <View style={[styles.container, { height: svgHeight }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>No map data available</Text>
        </View>
      </View>
    );
  }

  const { boundarySvg, zoneSvgs } = svgData;

  return (
    <View style={[styles.container, { height: svgHeight }]}>
      <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Field boundary — behind everything */}
        {boundarySvg && (
          <Path
            d={boundarySvg.path}
            fill="rgba(200, 200, 200, 0.15)"
            stroke="#9E9E9E"
            strokeWidth={2}
          />
        )}

        {/* Zone polygons */}
        {zoneSvgs.map((zone, index) => {
          const isSelected = selectedZoneId === zone.id;
          const colorIndex = index % ZONE_COLORS.length;
          const fillColor = isSelected ? SELECTED_COLOR : ZONE_COLORS[colorIndex];
          const strokeColor = isSelected ? SELECTED_STROKE : ZONE_STROKE_COLORS[colorIndex];
          const strokeWidth = isSelected ? 3 : 1.5;

          return (
            <React.Fragment key={zone.id || index}>
              {zone.paths.map((path, pathIdx) => (
                <Path
                  key={pathIdx}
                  d={path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  onPress={() => onZonePress && onZonePress(zone)}
                />
              ))}

              {/* Zone label */}
              {zone.centroid && zone.code && (
                <SvgText
                  x={zone.centroid.x}
                  y={zone.centroid.y}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize={isSelected ? 14 : 12}
                  fontWeight={isSelected ? 'bold' : '600'}
                  fill={isSelected ? '#E65100' : '#333'}
                >
                  {zone.code}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});
