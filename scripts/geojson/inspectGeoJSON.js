#!/usr/bin/env node
/**
 * inspectGeoJSON.js — Safely inspect GeoJSON files and generate metadata summaries.
 *
 * Uses streaming JSON parsing to avoid loading entire files into memory.
 * Generates lightweight summary files in Map/metadata/.
 *
 * Usage: node scripts/geojson/inspectGeoJSON.js
 */

const fs = require('fs');
const path = require('path');

const MAP_DIR = path.resolve(__dirname, '../../Map');
const METADATA_DIR = path.resolve(MAP_DIR, 'metadata');

// ── Ensure metadata directory exists ──────────────────────────
if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
  console.log('[BOUNDARY_DEBUG] Created metadata directory:', METADATA_DIR);
}

// ── Find all .geojson files in Map/ ──────────────────────────
const geojsonFiles = fs.readdirSync(MAP_DIR).filter(f => f.endsWith('.geojson'));

console.log('[BOUNDARY_DEBUG] Found GeoJSON files:', geojsonFiles.length);

if (geojsonFiles.length === 0) {
  console.warn('[BOUNDARY_WARN] No GeoJSON files found in Map/');
  process.exit(0);
}

// ── Streaming inspector ───────────────────────────────────────
// For large files, we use a streaming approach: read the file in chunks
// and parse incrementally to extract metadata without loading the full file.

function inspectGeoJSONStream(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    const sizeMB = Math.round((fileSize / (1024 * 1024)) * 100) / 100;

    console.log('[BOUNDARY_DEBUG] Inspecting GeoJSON file:', fileName);
    console.log('[BOUNDARY_DEBUG] File size MB:', sizeMB);

    // For files > 50MB, use streaming approach
    if (sizeMB > 50) {
      console.log('[BOUNDARY_WARN] Large GeoJSON detected:', fileName, '- using streaming inspection');
      inspectLargeFileStreaming(filePath, fileName, sizeMB)
        .then(resolve)
        .catch(reject);
    } else {
      // For smaller files, we can load and inspect directly
      console.log('[BOUNDARY_DEBUG] File size acceptable, loading directly:', fileName);
      inspectSmallFile(filePath, fileName, sizeMB)
        .then(resolve)
        .catch(reject);
    }
  });
}

function inspectSmallFile(filePath, fileName, sizeMB) {
  return new Promise((resolve, reject) => {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(raw);

      if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        reject(new Error(`Invalid GeoJSON FeatureCollection: ${fileName}`));
        return;
      }

      const features = geojson.features;
      const featureCount = features.length;
      const geometryTypes = new Set();
      const propertyKeys = new Set();
      const sampleFeatures = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasNullGeometry = false;
      let hasInvalidCoords = false;

      for (let i = 0; i < features.length; i++) {
        const feature = features[i];

        // Geometry types
        if (feature.geometry && feature.geometry.type) {
          geometryTypes.add(feature.geometry.type);
        } else {
          hasNullGeometry = true;
        }

        // Property keys
        if (feature.properties) {
          Object.keys(feature.properties).forEach(k => propertyKeys.add(k));
        }

        // Bounding box from coordinates
        if (feature.geometry && feature.geometry.coordinates) {
          const coords = feature.geometry.coordinates;
          const flatCoords = flattenCoordinates(coords);
          for (const [x, y] of flatCoords) {
            if (typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y)) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            } else {
              hasInvalidCoords = true;
            }
          }
        }

        // Sample features (first 3)
        if (sampleFeatures.length < 3) {
          const name = feature.properties?.name || feature.properties?.NAME || feature.properties?.Name || feature.properties?.ten || feature.properties?.TEN || 'N/A';
          const geometryType = feature.geometry?.type || 'N/A';
          const coordSample = getFirstCoordinate(feature.geometry?.coordinates);
          sampleFeatures.push({ name, geometryType, coordinateSample: coordSample });
        }
      }

      // Determine if coordinates are [lng, lat] (check if typical Vietnam bounds)
      const isLngLat = minX > 100 && maxX < 110 && minY > 8 && maxY < 24;

      const bbox = [minX, minY, maxX, maxY];

      console.log('[BOUNDARY_DEBUG] Feature count:', featureCount);
      console.log('[BOUNDARY_DEBUG] Geometry types:', Array.from(geometryTypes));
      console.log('[BOUNDARY_DEBUG] Property keys:', Array.from(propertyKeys));
      console.log('[BOUNDARY_DEBUG] BBox:', bbox);

      const safeForDirectFrontendLoad = sizeMB < 5 && featureCount < 5000;
      const recommendedLoadingStrategy = safeForDirectFrontendLoad
        ? 'direct-frontend-load'
        : sizeMB < 50
          ? 'lazy-load-simplified'
          : 'lazy-load-simplified-or-vector-tiles';

      const summary = {
        file: fileName,
        sizeMB,
        featureCount,
        geometryTypes: Array.from(geometryTypes),
        propertyKeys: Array.from(propertyKeys),
        bbox,
        coordinateSystem: isLngLat ? '[longitude, latitude]' : '[latitude, longitude] or unknown',
        sampleFeatures,
        hasNullGeometry,
        hasInvalidCoords,
        safeForDirectFrontendLoad,
        recommendedLoadingStrategy,
        inspectedAt: new Date().toISOString(),
      };

      resolve(summary);
    } catch (err) {
      reject(err);
    }
  });
}

function inspectLargeFileStreaming(filePath, fileName, sizeMB) {
  return new Promise((resolve, reject) => {
    try {
      // For very large files, we read in chunks to extract metadata
      // We parse the first portion to get structure, then sample features
      const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
      const buffer = Buffer.alloc(CHUNK_SIZE);
      const fd = fs.openSync(filePath, 'r');

      // Read first chunk to get structure
      const bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, 0);
      const firstChunk = buffer.slice(0, bytesRead).toString('utf8');

      // Try to parse incrementally
      const geometryTypes = new Set();
      const propertyKeys = new Set();
      const sampleFeatures = [];
      let featureCount = 0;
      let hasNullGeometry = false;
      let hasInvalidCoords = false;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      // Strategy: Read file line by line and count features
      // For GeoJSON features, each feature is a JSON object in the features array
      const lineReader = require('readline').createInterface({
        input: fs.createReadStream(filePath, { encoding: 'utf8' }),
        crlfDelay: Infinity,
      });

      let inFeatures = false;
      let featureBuffer = '';
      let braceDepth = 0;
      let processedCount = 0;
      const MAX_FEATURES_TO_INSPECT = 100; // Only inspect first 100 features for metadata

      lineReader.on('line', (line) => {
        const trimmed = line.trim();

        // Count features by detecting "type": "Feature" patterns
        if (trimmed.includes('"type"') && trimmed.includes('"Feature"')) {
          featureCount++;
        }

        // For sampling, we need to parse some features
        // We'll use a simple approach: accumulate lines until we have complete features
        if (sampleFeatures.length < 3 && processedCount < MAX_FEATURES_TO_INSPECT) {
          featureBuffer += line + '\n';
          braceDepth += (line.match(/{/g) || []).length;
          braceDepth -= (line.match(/}/g) || []).length;

          if (braceDepth <= 0 && featureBuffer.trim().length > 0) {
            // Try to parse as a feature
            try {
              // Clean up the feature buffer to make it valid JSON
              let cleanBuffer = featureBuffer.trim();
              // Remove trailing comma if present
              if (cleanBuffer.endsWith(',')) {
                cleanBuffer = cleanBuffer.slice(0, -1);
              }

              const feature = JSON.parse(cleanBuffer);
              if (feature.type === 'Feature') {
                processedCount++;

                // Geometry types
                if (feature.geometry && feature.geometry.type) {
                  geometryTypes.add(feature.geometry.type);
                } else {
                  hasNullGeometry = true;
                }

                // Property keys
                if (feature.properties) {
                  Object.keys(feature.properties).forEach(k => propertyKeys.add(k));
                }

                // Bounding box from first feature coordinates
                if (feature.geometry && feature.geometry.coordinates) {
                  const coords = feature.geometry.coordinates;
                  const flatCoords = flattenCoordinates(coords);
                  for (const [x, y] of flatCoords) {
                    if (typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y)) {
                      if (x < minX) minX = x;
                      if (y < minY) minY = y;
                      if (x > maxX) maxX = x;
                      if (y > maxY) maxY = y;
                    } else {
                      hasInvalidCoords = true;
                    }
                  }
                }

                // Sample
                const name = feature.properties?.name || feature.properties?.NAME || feature.properties?.Name || feature.properties?.ten || feature.properties?.TEN || 'N/A';
                const geometryType = feature.geometry?.type || 'N/A';
                const coordSample = getFirstCoordinate(feature.geometry?.coordinates);
                sampleFeatures.push({ name, geometryType, coordinateSample: coordSample });
              }
            } catch (parseErr) {
              // Not a complete feature yet, continue accumulating
            }
            featureBuffer = '';
            braceDepth = 0;
          }
        }
      });

      lineReader.on('close', () => {
        fs.closeSync(fd);

        const isLngLat = minX > 100 && maxX < 110 && minY > 8 && maxY < 24;
        const bbox = minX !== Infinity ? [minX, minY, maxX, maxY] : [0, 0, 0, 0];

        console.log('[BOUNDARY_DEBUG] Feature count (approx):', featureCount);
        console.log('[BOUNDARY_DEBUG] Geometry types:', Array.from(geometryTypes));
        console.log('[BOUNDARY_DEBUG] Property keys:', Array.from(propertyKeys));
        console.log('[BOUNDARY_DEBUG] BBox (sampled):', bbox);
        console.warn('[BOUNDARY_WARN] Large GeoJSON detected:', fileName);

        const safeForDirectFrontendLoad = false;
        const recommendedLoadingStrategy = 'lazy-load-simplified-or-vector-tiles';

        const summary = {
          file: fileName,
          sizeMB,
          featureCount,
          featureCountNote: 'approximate - counted via streaming',
          geometryTypes: Array.from(geometryTypes),
          propertyKeys: Array.from(propertyKeys),
          bbox,
          coordinateSystem: isLngLat ? '[longitude, latitude]' : '[latitude, longitude] or unknown',
          sampleFeatures,
          hasNullGeometry,
          hasInvalidCoords,
          safeForDirectFrontendLoad,
          recommendedLoadingStrategy,
          inspectedAt: new Date().toISOString(),
        };

        resolve(summary);
      });

      lineReader.on('error', (err) => {
        fs.closeSync(fd);
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
}

// ── Helper: Flatten nested coordinate arrays ──────────────────
function flattenCoordinates(coords) {
  const result = [];
  if (!Array.isArray(coords)) return result;

  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return [coords];
  }

  for (const item of coords) {
    result.push(...flattenCoordinates(item));
  }
  return result;
}

// ── Helper: Get first coordinate from geometry ────────────────
function getFirstCoordinate(coords) {
  if (!coords || !Array.isArray(coords)) return null;
  if (coords.length >= 2 && typeof coords[0] === 'number') {
    return [Math.round(coords[0] * 1000) / 1000, Math.round(coords[1] * 1000) / 1000];
  }
  for (const item of coords) {
    const result = getFirstCoordinate(item);
    if (result) return result;
  }
  return null;
}

// ── Main execution ────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GeoJSON Metadata Inspector');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const file of geojsonFiles) {
    const filePath = path.join(MAP_DIR, file);
    try {
      const summary = await inspectGeoJSONStream(filePath);

      // Write summary file
      const summaryFileName = file.replace('.geojson', '.summary.json');
      const summaryPath = path.join(METADATA_DIR, summaryFileName);
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
      console.log('[BOUNDARY_DEBUG] Summary written:', summaryPath);
      console.log('---\n');
    } catch (err) {
      console.error('[BOUNDARY_ERROR] Failed to inspect:', file, err.message);
    }
  }

  // Write overall inventory
  const inventory = {
    inspectedAt: new Date().toISOString(),
    files: geojsonFiles.map(f => {
      const summaryFile = f.replace('.geojson', '.summary.json');
      const summaryPath = path.join(METADATA_DIR, summaryFile);
      if (fs.existsSync(summaryPath)) {
        return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      }
      return { file: f, error: 'summary not generated' };
    }),
  };

  const inventoryPath = path.join(METADATA_DIR, 'inventory.json');
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2), 'utf8');
  console.log('[BOUNDARY_DEBUG] Inventory written:', inventoryPath);
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Inspection complete');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('[BOUNDARY_ERROR] Fatal error:', err);
  process.exit(1);
});