/**
 * useLayoutConfig — Resolves the current grid layout from config.
 *
 * Determines:
 *   1. Current viewport breakpoint (mobile / tablet / default)
 *   2. Active layout variant (inference / admin) based on route
 *   3. Resolved grid config (columns, rows, areas)
 *   4. Ordered list of widgets to render
 *
 * No layout logic lives in GridShell — this hook is the bridge
 * between configuration data and the renderer.
 */

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'expo-router';
import {
  LAYOUT_VARIANTS,
  ROUTE_VARIANT_MAP,
  DEFAULT_VARIANT,
  WIDGET_REGISTRY,
  BREAKPOINTS,
} from '../layoutConfig';

function getBreakpoint(width) {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'default';
}

export function useLayoutConfig() {
  const pathname = usePathname();

  // ─── Viewport breakpoint ───────────────────────────────────────────────
  const [bp, setBp] = useState(() =>
    typeof window !== 'undefined'
      ? getBreakpoint(window.innerWidth)
      : 'default',
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setBp(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ─── Variant from route ────────────────────────────────────────────────
  const variantName = useMemo(() => {
    const match = ROUTE_VARIANT_MAP.find((r) => pathname.includes(r.pattern));
    return match?.variant ?? DEFAULT_VARIANT;
  }, [pathname]);

  // ─── Resolved layout (with breakpoint fallback) ────────────────────────
  const layout = useMemo(() => {
    const variant = LAYOUT_VARIANTS[variantName];
    return variant[bp] ?? variant.tablet ?? variant.default;
  }, [variantName, bp]);

  // ─── Unique widget list from areas ─────────────────────────────────────
  const widgets = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const row of layout.areas) {
      for (const name of row) {
        if (!seen.has(name) && WIDGET_REGISTRY[name]) {
          seen.add(name);
          result.push({ name, ...WIDGET_REGISTRY[name] });
        }
      }
    }
    return result;
  }, [layout]);

  return { layout, widgets, bp, variantName };
}
