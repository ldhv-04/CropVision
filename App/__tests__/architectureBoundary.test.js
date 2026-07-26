const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');

const APP_ROOT = path.resolve(__dirname, '..');
const MODULE_ROOT = path.join(APP_ROOT, 'src', 'modules');
const ROUTE_ROOT = path.join(APP_ROOT, 'app');
const STATION_ROOT = path.join(MODULE_ROOT, 'station');
const AGRIVISION_ROOT = path.join(MODULE_ROOT, 'agrivision');
const CORE_ROOTS = [
  path.join(MODULE_ROOT, '@core'),
  path.join(MODULE_ROOT, 'platform'),
  path.join(MODULE_ROOT, 'shared'),
];
const COMPATIBILITY_ROOTS = [
  path.join(MODULE_ROOT, 'legacy', 'GridShell'),
  path.join(MODULE_ROOT, '@core', 'components', 'GridShell'),
  path.join(MODULE_ROOT, '@core', 'components', 'MapShell'),
  path.join(MODULE_ROOT, '@core', 'components', 'MapSidebar'),
  path.join(MODULE_ROOT, '@core', 'components', 'MapDetailDrawer'),
  path.join(MODULE_ROOT, '@core', 'components', 'TimelineScrubber'),
  path.join(MODULE_ROOT, '@core', 'store'),
  path.join(STATION_ROOT, 'shell'),
  path.join(STATION_ROOT, 'widgets', 'GridShell'),
  path.join(AGRIVISION_ROOT, 'shell'),
  path.join(AGRIVISION_ROOT, 'widgets', 'GridShell'),
];

// Temporary L2 baseline exceptions. Later phases may only remove entries.
const OWNER_PRIVATE_ALLOWLIST = new Set([
  'app/(agrivision)/_layout.js -> ../../src/modules/agrivision/shell',
  'src/modules/legacy/GridShell/compat/contentRegistry.js -> ../../../agrivision/screens/MobileFieldsScreen',
  'src/modules/legacy/GridShell/compat/contentRegistry.js -> ../../../station/pages/SystemPage',
  'src/modules/legacy/GridShell/widgets/AlertsFeedWidget.jsx -> ../../../station/widgets/GridShell/AlertsFeedWidget',
  'src/modules/legacy/GridShell/widgets/CanvasWidget.jsx -> ../../../agrivision/widgets/GridShell/CanvasWidget',
  'src/modules/legacy/GridShell/widgets/ChatWidget.jsx -> ../../../agrivision/widgets/GridShell/ChatWidget',
  'src/modules/legacy/GridShell/widgets/ControlWidget.jsx -> ../../../agrivision/widgets/GridShell/ControlWidget',
  'src/modules/legacy/GridShell/widgets/EpidemicLedgerWidget.jsx -> ../../../agrivision/widgets/GridShell/EpidemicLedgerWidget',
  'src/modules/legacy/GridShell/widgets/MapWidget.jsx -> ../../../agrivision/widgets/GridShell/MapWidget',
  'src/modules/legacy/GridShell/widgets/OverviewStatsWidget.jsx -> ../../../station/widgets/GridShell/OverviewStatsWidget',
  'src/modules/legacy/GridShell/widgets/ResultsWidget.jsx -> ../../../agrivision/widgets/GridShell/ResultsWidget',
  'src/modules/legacy/GridShell/widgets/ScanTrendWidget.jsx -> ../../../station/widgets/GridShell/ScanTrendWidget',
  'src/modules/legacy/GridShell/widgets/SensorGridWidget.jsx -> ../../../station/widgets/GridShell/SensorGridWidget',
  'src/modules/legacy/GridShell/widgets/StatsWidget.jsx -> ../../../agrivision/widgets/GridShell/StatsWidget',
]);
const ROUTE_MODULE_ALLOWLIST = new Set([
  'app/(agrivision)/chat.js -> ../../src/modules/@core/api/apiClient',
  'app/(agrivision)/diagnosis-result.js -> ../../src/modules/inference/store/useInferenceStore',
  'app/(agrivision)/diagnosis-result.js -> ../../src/modules/@core/api/apiClient',
  'app/(agrivision)/diagnosis-result.js -> ../../src/modules/inference/components/InferenceDebugPanel',
  'app/(agrivision)/diagnosis-result.js -> ../../src/modules/inference/debug/inferenceDebug',
  'app/(agrivision)/encyclopedia.js -> ../../src/modules/@core/api/apiClient',
  'app/(agrivision)/encyclopedia.js -> ../../src/modules/@core/api/endpoints',
  'app/(agrivision)/inference.js -> ../../src/modules/inference/components/InferenceLayout',
  'app/(agrivision)/inference.js -> ../../src/modules/inference/debug/inferenceDebug',
  'app/(agrivision)/settings.js -> ../../src/modules/@core/api/apiClient',
  'app/(main)/alerts.js -> ../../src/modules/admin/components/AlertsAdminScreen',
  'app/(main)/history.js -> ../../src/modules/history/components/SampleList',
]);
const COMPATIBILITY_CONSUMER_ALLOWLIST = new Set([
  'app/(agrivision)/_layout.js -> ../../src/modules/agrivision/shell',
  'app/(main)/_layout.js -> ../../src/modules/@core/components/GridShell',
]);

function normalize(filePath) {
  return path.relative(APP_ROOT, filePath).replace(/\\/g, '/');
}

function isInside(filePath, root) {
  return filePath === root || filePath.startsWith(`${root}${path.sep}`);
}

function sourceFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, visit));
    return;
  }

  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (!['loc', 'start', 'end', 'extra', 'comments', 'tokens'].includes(key)) {
      walk(value, visit);
    }
  }
}

function parseFile(filePath) {
  return parser.parse(fs.readFileSync(filePath, 'utf8'), {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript', 'dynamicImport'],
  });
}

function dependencies(filePath) {
  const found = [];
  walk(parseFile(filePath), (node) => {
    if (node.type === 'ImportDeclaration') {
      found.push({ kind: 'import', specifier: node.source.value });
    } else if (
      (node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') &&
      node.source
    ) {
      found.push({ kind: 'export', specifier: node.source.value });
    } else if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'require') {
      found.push(
        node.arguments.length === 1 && node.arguments[0].type === 'StringLiteral'
          ? { kind: 'require', specifier: node.arguments[0].value }
          : { kind: 'dynamic require', specifier: null },
      );
    } else if (node.type === 'CallExpression' && node.callee?.type === 'Import') {
      found.push(
        node.arguments.length === 1 && node.arguments[0].type === 'StringLiteral'
          ? { kind: 'import()', specifier: node.arguments[0].value }
          : { kind: 'dynamic import()', specifier: null },
      );
    } else if (node.type === 'ImportExpression') {
      found.push(
        node.source?.type === 'StringLiteral'
          ? { kind: 'import()', specifier: node.source.value }
          : { kind: 'dynamic import()', specifier: null },
      );
    }
  });
  return found;
}

function resolveLocal(importer, specifier) {
  return specifier?.startsWith('.') ? path.resolve(path.dirname(importer), specifier) : null;
}

function edge(importer, specifier) {
  return `${normalize(importer)} -> ${specifier}`;
}

function isOwnerPublic(target, ownerRoot) {
  return target === ownerRoot || target === path.join(ownerRoot, 'index');
}

function isNeutralRouteTarget(target) {
  const coreRoot = path.join(MODULE_ROOT, '@core');
  const apiRoot = path.join(coreRoot, 'api');
  const landingRoot = path.join(MODULE_ROOT, 'landing');
  return (isInside(target, coreRoot) && !isInside(target, apiRoot)) || target === landingRoot;
}

function allDependencies() {
  return [...sourceFiles(ROUTE_ROOT), ...sourceFiles(MODULE_ROOT)].flatMap((importer) =>
    dependencies(importer).map((dependency) => ({ importer, ...dependency })),
  );
}

function exportedConst(filePath, name) {
  let init = null;
  walk(parseFile(filePath), (node) => {
    if (node.type === 'VariableDeclarator' && node.id?.name === name) init = node.init;
  });
  if (!init) throw new Error(`Missing ${name} in ${normalize(filePath)}`);
  return init;
}

function objectKeys(node) {
  return node.properties.map((property) => property.key.name ?? property.key.value).sort();
}

function arrayPropertyValues(node, propertyName) {
  return node.elements
    .map((element) => element.properties.find((property) => (property.key.name ?? property.key.value) === propertyName))
    .map((property) => property.value.value)
    .sort();
}

function exportedNames(filePath) {
  const names = [];
  walk(parseFile(filePath), (node) => {
    if (node.type === 'ExportNamedDeclaration') {
      node.specifiers.forEach((specifier) => names.push(specifier.exported.name ?? specifier.exported.value));
    }
  });
  return names.sort();
}

describe('bounded modulith architecture', () => {
  const graph = allDependencies();

  test('all dependency syntax is parseable and dynamic module expressions are forbidden', () => {
    const violations = graph
      .filter(({ specifier }) => specifier === null)
      .map(({ importer, kind }) => `${normalize(importer)}: ${kind}`);
    expect(violations).toEqual([]);
  });

  test('owners do not import each other and neutral modules do not import owners', () => {
    const violations = graph.flatMap(({ importer, specifier }) => {
      const target = resolveLocal(importer, specifier);
      if (!target) return [];
      if (isInside(importer, STATION_ROOT) && isInside(target, AGRIVISION_ROOT)) return [edge(importer, specifier)];
      if (isInside(importer, AGRIVISION_ROOT) && isInside(target, STATION_ROOT)) return [edge(importer, specifier)];
      if (CORE_ROOTS.some((root) => isInside(importer, root)) &&
          (isInside(target, STATION_ROOT) || isInside(target, AGRIVISION_ROOT))) {
        return [edge(importer, specifier)];
      }
      return [];
    });
    expect(violations).toEqual([]);
  });

  test('external consumers use owner public entries or fixed baseline exceptions', () => {
    const violations = graph.flatMap(({ importer, specifier }) => {
      const target = resolveLocal(importer, specifier);
      if (!target) return [];
      for (const ownerRoot of [STATION_ROOT, AGRIVISION_ROOT]) {
        if (isInside(target, ownerRoot) && !isInside(importer, ownerRoot) && !isOwnerPublic(target, ownerRoot)) {
          const currentEdge = edge(importer, specifier);
          if (!OWNER_PRIVATE_ALLOWLIST.has(currentEdge)) return [currentEdge];
        }
      }
      return [];
    });
    expect(violations).toEqual([]);
  });

  test('routes add no module responsibility outside public entries or the fixed baseline', () => {
    const violations = graph.flatMap(({ importer, specifier }) => {
      const target = resolveLocal(importer, specifier);
      if (!target || !isInside(importer, ROUTE_ROOT) || !isInside(target, MODULE_ROOT)) return [];
      if (isOwnerPublic(target, STATION_ROOT) || isOwnerPublic(target, AGRIVISION_ROOT)) return [];
      const currentEdge = edge(importer, specifier);
      return isNeutralRouteTarget(target) ||
        OWNER_PRIVATE_ALLOWLIST.has(currentEdge) ||
        ROUTE_MODULE_ALLOWLIST.has(currentEdge)
        ? []
        : [currentEdge];
    });
    expect(violations).toEqual([]);
  });

  test('legacy and GridShell compatibility gain no consumers', () => {
    const violations = graph.flatMap(({ importer, specifier }) => {
      const target = resolveLocal(importer, specifier);
      if (!target || !COMPATIBILITY_ROOTS.some((root) => isInside(target, root))) return [];
      if (COMPATIBILITY_ROOTS.some((root) => isInside(importer, root))) return [];
      const currentEdge = edge(importer, specifier);
      return COMPATIBILITY_CONSUMER_ALLOWLIST.has(currentEdge) ? [] : [currentEdge];
    });
    expect(violations).toEqual([]);
  });

  test('compatibility registries and routes have exactly the audited keys', () => {
    const legacyRoot = path.join(MODULE_ROOT, 'legacy', 'GridShell');
    const content = exportedConst(path.join(legacyRoot, 'compat', 'contentRegistry.js'), 'COMPAT_CONTENT_REGISTRY');
    const menu = exportedConst(path.join(legacyRoot, 'compat', 'menuRoutes.js'), 'COMPAT_MENU_ROUTES');
    const layoutFile = path.join(legacyRoot, 'layoutConfig.js');
    const widgets = exportedConst(layoutFile, 'WIDGET_REGISTRY');
    const layouts = exportedConst(layoutFile, 'LAYOUT_VARIANTS');
    const routes = exportedConst(layoutFile, 'ROUTE_VARIANT_MAP');

    expect(objectKeys(content)).toEqual(['admin', 'alerts', 'fields', 'history', 'system']);
    expect(objectKeys(menu)).toEqual([
      'agrivisionHome',
      'agrivisionInference',
      'legacyAlerts',
      'legacyFields',
      'legacyHistory',
      'legacySystem',
    ]);
    expect(objectKeys(widgets)).toEqual([
      'AlertsFeed', 'Canvas', 'Chat', 'Content', 'Control', 'EpidemicLedger', 'Map', 'Menu',
      'Nav', 'OverviewStats', 'Results', 'ScanTrend', 'SensorGrid', 'Stats', 'User',
    ]);
    expect(objectKeys(layouts)).toEqual(['admin', 'dashboard', 'inference']);
    expect(arrayPropertyValues(routes, 'pattern')).toEqual([
      '/(agrivision)/inference', '/(station)', '/alerts', '/fields', '/history', '/inference', '/system',
    ]);
  });

  test('transport does not import the auth store', () => {
    const transportRoot = path.join(MODULE_ROOT, '@core', 'api');
    const authRoot = path.join(MODULE_ROOT, '@core', 'auth');
    const violations = graph.flatMap(({ importer, specifier }) => {
      const target = resolveLocal(importer, specifier);
      if (!target || !isInside(importer, transportRoot) || !isInside(target, authRoot)) return [];
      return [edge(importer, specifier)];
    });
    expect(violations).toEqual([]);
  });

  test('Station exposes only its audited public screens and shell', () => {
    expect(exportedNames(path.join(STATION_ROOT, 'index.js'))).toEqual([
      'StationAlertsScreen',
      'StationDashboardScreen',
      'StationFieldsScreen',
      'StationInterventionsScreen',
      'StationMicrobiomeScreen',
      'StationRecommendationsScreen',
      'StationReportsScreen',
      'StationSensorsScreen',
      'StationSettingsScreen',
      'StationShell',
      'StationSystemScreen',
    ]);
  });

  test('Agrivision exposes only its audited public screens, components, and stores', () => {
    expect(exportedNames(path.join(AGRIVISION_ROOT, 'index.js'))).toEqual([
      'CameraModal',
      'FieldMapScreen',
      'FieldsLegacyScreen',
      'HomeScreen',
      'MobileFieldDetailScreen',
      'MobileFieldsScreen',
      'MobileZoneCultivationScreen',
      'WeatherWidget',
      'ZoneDetailScreen',
      'useFieldStore',
      'useSubZoneStore',
    ]);
  });
  test('native Station fields do not load the browser-only map stack', () => {
    const nativeFields = path.join(STATION_ROOT, 'pages', 'FieldsPage.native.jsx');

    expect(fs.existsSync(nativeFields)).toBe(true);
    expect(dependencies(nativeFields)).toEqual([]);
  });
});
