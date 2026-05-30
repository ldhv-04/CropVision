import { useMemo } from 'react';
import useFieldMapStore from '../stores/fieldMapStore';
import useMetricStore from '../stores/metricStore';
import { getZoneColor, LAYER_LEGENDS } from '../utils/colorScales';

/**
 * useLayerColor — Computes polygon fill color for a zone based on the active layer.
 *
 * @param {object} zone - zone object from the API (must have status and/or latest_metrics)
 * @returns {{ color: string, legend: object, activeLayer: string }}
 */
export default function useLayerColor(zone) {
  const activeLayer = useFieldMapStore((s) => s.activeLayer);
  const getColorValue = useMetricStore((s) => s.getColorValue);

  const color = useMemo(() => {
    if (!zone) return '#6b7280';

    if (activeLayer === 'disease') {
      return getZoneColor('disease', zone.status);
    }

    // Try color_values from aggregated summary first
    const colorVal = getColorValue(zone.id, activeLayer);
    if (colorVal) {
      // If backend provides a pre-computed value
      const value = colorVal.normalized != null
        ? colorVal.normalized * (LAYER_LEGENDS[activeLayer]?.max || 100)
        : colorVal.value;
      return getZoneColor(activeLayer, value);
    }

    // Fall back to latest_metrics from zone object
    const metrics = zone.latest_metrics || zone;
    const metricMap = {
      moisture: 'soil_moisture',
      ph: 'soil_ph',
      nitrogen: 'nitrogen',
      temperature: 'temperature',
    };
    const metricKey = metricMap[activeLayer];
    if (metricKey && metrics[metricKey] != null) {
      return getZoneColor(activeLayer, metrics[metricKey]);
    }

    return '#6b7280';
  }, [zone, activeLayer, getColorValue]);

  const legend = LAYER_LEGENDS[activeLayer];

  return { color, legend, activeLayer };
}