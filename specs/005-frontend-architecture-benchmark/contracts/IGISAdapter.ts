/**
 * Core GIS SPI (Service Provider Interface) Contract
 * Decouples map visualization logic from concrete rendering engines (MapLibre GL, Native Maps).
 * Strictly compliant with Rule 2.10 (Lightweight Clean Architecture & DIP).
 */

import { FieldFeature, GISViewportState } from '../data-model';

export interface MapClickEvent {
  coordinates: [number, number]; // [longitude, latitude]
  featureId?: string;
  originalEvent?: unknown;
}

export interface MapLayerConfig {
  layerId: string;
  visible: boolean;
  opacity: number; // 0.0 to 1.0
  colorMap?: Record<string, string>;
}

export interface IGISAdapter {
  /**
   * Initializes the map engine on the provided DOM element or native canvas container.
   */
  initialize(container: unknown, initialViewport: GISViewportState): Promise<void>;

  /**
   * Updates the camera/viewport position with smooth transition animation.
   */
  setViewport(viewport: Partial<GISViewportState>): void;

  /**
   * Ingests a GeoJSON feature collection representing farm parcels or zones.
   */
  setFeatures(features: FieldFeature[]): void;

  /**
   * Highlights or focuses on a specific field boundary.
   */
  selectFeature(featureId: string | null): void;

  /**
   * Toggles or updates visibility and styling for a specific layer.
   */
  updateLayer(config: MapLayerConfig): void;

  /**
   * Registers interaction listeners for spatial events.
   */
  onMapClick(handler: (event: MapClickEvent) => void): () => void;
  onFeatureHover(handler: (featureId: string | null) => void): () => void;

  /**
   * Gracefully releases WebGL contexts, worker threads, and event listeners.
   */
  destroy(): void;
}
