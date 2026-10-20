/**
 * NativeMapsAdapter - Concrete GIS SPI Adapter for AgriVision Mobile
 * Encapsulates React Native Maps coordinate transformations and polygon bindings.
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC)
 * and Rule 2.10 (Hybrid OOP & Lightweight Clean Architecture).
 */

export class NativeMapsAdapter {
  constructor() {
    this._mapRef = null;
    this._features = [];
    this._viewport = { center: [105.8, 21.0], zoom: 14 };
    this._clickListeners = new Set();
    this._hoverListeners = new Set();
    this._isDestroyed = false;
    this._selectedFeatureId = null;
  }

  async initialize(mapRef, initialViewport) {
    this._mapRef = mapRef;
    this._isDestroyed = false;
    if (initialViewport) {
      this.setViewport(initialViewport);
    }
  }

  setViewport(viewport) {
    if (this._isDestroyed) return;
    if (viewport.center) this._viewport.center = viewport.center;
    if (typeof viewport.zoom === 'number') this._viewport.zoom = viewport.zoom;
  }

  setFeatures(features) {
    if (this._isDestroyed) return;
    this._features = Array.isArray(features) ? [...features] : [];
  }

  selectFeature(featureId) {
    if (this._isDestroyed) return;
    this._selectedFeatureId = featureId;
  }

  updateLayer() {
    // Mobile native handles layer rendering declaratively via React components
  }

  onMapClick(handler) {
    if (typeof handler !== 'function') return () => {};
    this._clickListeners.add(handler);
    return () => this._clickListeners.delete(handler);
  }

  onFeatureHover(handler) {
    if (typeof handler !== 'function') return () => {};
    this._hoverListeners.add(handler);
    return () => this._hoverListeners.delete(handler);
  }

  toNativeCoordinates(ring) {
    if (!Array.isArray(ring)) return [];
    return ring.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
  }

  destroy() {
    this._isDestroyed = true;
    this._clickListeners.clear();
    this._hoverListeners.clear();
    this._features = [];
    this._mapRef = null;
  }
}
