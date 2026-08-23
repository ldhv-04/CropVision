/**
 * FieldPolygonThumbnail — Render hình dạng hình học đa giác thực tế của thửa đất
 *
 * Sử dụng pure react-native-svg, tự động chuẩn hóa tọa độ GeoJSON theo bounding-box.
 * Tương thích 100% 3 chế độ tương phản màu sắc.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../@core/context/ThemeContext';

export function FieldPolygonThumbnail({
  boundary,
  width = 110,
  height = 95,
  isAlert = false,
}) {
  const { colors } = useTheme();

  // Chuẩn hóa tọa độ GeoJSON thành chuỗi điểm SVG "x1,y1 x2,y2 ..."
  const svgData = useMemo(() => {
    let coordinates = [];
    if (boundary?.coordinates && Array.isArray(boundary.coordinates[0])) {
      coordinates = boundary.coordinates[0];
    } else if (Array.isArray(boundary)) {
      coordinates = boundary;
    }

    // Nếu không có tọa độ, dùng hình đa giác mặc định
    if (!coordinates || coordinates.length < 3) {
      return {
        pointsStr: '15,20 95,15 85,80 20,75',
        centroid: { x: 55, y: 47 },
      };
    }

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    coordinates.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });

    const padding = 12;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;

    const spanLng = maxLng - minLng || 0.0001;
    const spanLat = maxLat - minLat || 0.0001;

    const points = coordinates.map(([lng, lat]) => {
      const x = padding + ((lng - minLng) / spanLng) * drawW;
      // Trục Y màn hình tăng dần từ trên xuống, nên vĩ độ cao hơn ở trên
      const y = padding + ((maxLat - lat) / spanLat) * drawH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      pointsStr: points.join(' '),
      centroid: { x: width / 2, y: height / 2 },
    };
  }, [boundary, width, height]);

  const fillColor = isAlert ? colors.dangerBg : colors.polygonFill;
  const strokeColor = isAlert ? colors.danger : colors.polygonStroke;

  return (
    <View style={[styles.container, { width, height, backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Subtle grid watermark */}
        <Line x1={width / 2} y1={4} x2={width / 2} y2={height - 4} stroke={colors.borderLight} strokeWidth="0.75" strokeDasharray="3,3" />
        <Line x1={4} y1={height / 2} x2={width - 4} y2={height / 2} stroke={colors.borderLight} strokeWidth="0.75" strokeDasharray="3,3" />

        {/* Real Parcel Boundary Polygon */}
        <Polygon
          points={svgData.pointsStr}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Center Target Mark */}
        <Circle cx={svgData.centroid.x} cy={svgData.centroid.y} r="2.5" fill={strokeColor} />
      </Svg>

      {/* North Arrow & Cadastral Tag */}
      <View style={styles.badgeNorth}>
        <Text style={[styles.badgeNorthText, { color: colors.textMuted }]}>N ↑</Text>
      </View>

      <View style={[styles.badgeCadastral, { backgroundColor: isAlert ? colors.dangerBg : colors.primaryBg, borderColor: isAlert ? colors.dangerBorder : colors.primaryBorder }]}>
        <Text style={[styles.badgeCadastralText, { color: isAlert ? colors.danger : colors.primary }]}>
          {isAlert ? 'CẢNH BÁO' : 'ĐA GIÁC THẬT'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNorth: {
    position: 'absolute',
    top: 4,
    left: 6,
  },
  badgeNorthText: {
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  badgeCadastral: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
  },
  badgeCadastralText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

export default FieldPolygonThumbnail;
