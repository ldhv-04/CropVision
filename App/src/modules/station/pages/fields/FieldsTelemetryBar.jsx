/**
 * FieldsTelemetryBar — Bottom Telemetry KPI Strip.
 * Complies with Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

export function FieldsTelemetryBar({ fields = [] }) {
  const activeCount = fields.filter((f) => f.status === 'ACTIVE').length;
  const totalArea = fields.reduce((sum, f) => sum + (f.area ? parseFloat(f.area) : 0), 0);

  return (
    <View style={styles.kpiBar}>
      <View style={styles.kpiItem}>
        <Text style={styles.kpiValue}>{fields.length}</Text>
        <Text style={styles.kpiLabel}>TOTAL SECTORS</Text>
      </View>
      <View style={styles.kpiDivider} />
      <View style={styles.kpiItem}>
        <Text style={styles.kpiValue}>{activeCount}</Text>
        <Text style={styles.kpiLabel}>ACTIVE CROPS</Text>
      </View>
      <View style={styles.kpiDivider} />
      <View style={styles.kpiItem}>
        <Text style={styles.kpiValue}>{totalArea.toFixed(1)} ha</Text>
        <Text style={styles.kpiLabel}>MANAGED LAND</Text>
      </View>
    </View>
  );
}
