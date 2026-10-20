/**
 * MapLibre Tile & Layer Styles Configuration.
 * Complies with Rule 2.1 (<= 300 LOC).
 */

export const MAP_MAX_ZOOM = 19;
export const MAP_MIN_ZOOM = 3;

export const TILE_STYLES = {
  osm: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  terrain: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

export const STATUS_COLORS = {
  ACTIVE: '#4CAF50',
  INACTIVE: '#9E9E9E',
  FALLOW: '#795548',
};

export function buildRasterStyle(baseMap) {
  const urls = {
    osm: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
  };
  const attributions = {
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    satellite: '&copy; Esri',
    terrain: '&copy; OpenTopoMap',
  };

  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [urls[baseMap] || urls.osm],
        tileSize: 256,
        maxzoom: MAP_MAX_ZOOM,
        attribution: attributions[baseMap] || attributions.osm,
      },
    },
    layers: [
      {
        id: 'raster-layer',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: MAP_MIN_ZOOM,
        maxzoom: MAP_MAX_ZOOM,
      },
    ],
  };
}
