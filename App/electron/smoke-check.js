const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const appRoot = path.resolve(__dirname, '..');
const electronDir = path.join(appRoot, 'electron');
const requiredFiles = [
  path.join(electronDir, 'launch.js'),
  path.join(electronDir, 'main.js'),
  path.join(electronDir, 'preload.js'),
  path.join(electronDir, 'securityPolicy.js'),
  path.join(electronDir, 'staticServer.js'),
];

function relative(filePath) {
  return path.relative(appRoot, filePath).replace(/\\/g, '/');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFileExists(filePath) {
  assert(fs.existsSync(filePath), `Missing required Electron file: ${relative(filePath)}`);
}

function assertSyntax(filePath) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    cwd: appRoot,
    stdio: 'inherit',
  });

  assert(result.status === 0, `Syntax check failed: ${relative(filePath)}`);
}

function assertPolicyBehavior() {
  const policy = require('./securityPolicy');
  const requiredExports = [
    'isLocalRendererUrl',
    'isAllowedExternalUrl',
    'isAllowedNavigationUrl',
    'isTrustedRendererUrl',
  ];

  for (const exportName of requiredExports) {
    assert(
      typeof policy[exportName] === 'function',
      `Missing security policy export: ${exportName}`
    );
  }

  assert(policy.isLocalRendererUrl('http://localhost:8081'), 'localhost renderer URL must be allowed');
  assert(policy.isLocalRendererUrl('http://127.0.0.1:8081'), '127.0.0.1 renderer URL must be allowed');
  assert(policy.isLocalRendererUrl('http://[::1]:8081'), 'IPv6 localhost renderer URL must be allowed');
  assert(!policy.isLocalRendererUrl('http://localhost:3000'), 'backend port must not be a renderer URL');

  assert(
    policy.isAllowedNavigationUrl('http://localhost:8081/(station)', { isPackaged: false }),
    'dev renderer navigation must be allowed while unpackaged'
  );
  assert(
    !policy.isAllowedNavigationUrl('http://localhost:8081/(station)', { isPackaged: true }),
    'packaged navigation should not allow dev renderer URLs'
  );
  assert(
    policy.isAllowedNavigationUrl('http://127.0.0.1:49152/(station)', {
      isPackaged: true,
      trustedRendererOrigin: 'http://127.0.0.1:49152',
    }),
    'production navigation must allow only its trusted loopback origin'
  );
  assert(
    !policy.isAllowedNavigationUrl('http://127.0.0.1:49153/(station)', {
      isPackaged: true,
      trustedRendererOrigin: 'http://127.0.0.1:49152',
    }),
    'production navigation must reject other loopback ports'
  );
  assert(!policy.isAllowedNavigationUrl('https://example.com', { isPackaged: false }), 'remote navigation must be blocked');

  assert(policy.isAllowedExternalUrl('https://example.com'), 'https external URL must be allowed');
  assert(!policy.isAllowedExternalUrl('http://example.com'), 'non-local http external URL must be blocked');
  assert(!policy.isAllowedExternalUrl('file:///tmp/file.txt'), 'file protocol must be blocked');
  assert(!policy.isAllowedExternalUrl('javascript:alert(1)'), 'javascript protocol must be blocked');
  assert(!policy.isAllowedExternalUrl('data:text/html,hello'), 'data protocol must be blocked');
  assert(!policy.isAllowedExternalUrl('notaurl'), 'invalid URL must be blocked');
}

function assertMainReferencesPreload() {
  const mainSource = fs.readFileSync(path.join(electronDir, 'main.js'), 'utf8');

  assert(
    mainSource.includes("path.join(__dirname, 'preload.js')"),
    'main.js must resolve the preload path from the Electron directory'
  );
  assert(
    !mainSource.includes('cropvision.vercel.app'),
    'main.js must not load the old Vercel packaged URL'
  );
  assert(
    mainSource.includes('startStaticRendererServer'),
    'main.js must start the packaged renderer from a constrained local origin'
  );
  assert(
    mainSource.includes('CROPVISION_DESKTOP_RENDERER_MODE'),
    'main.js must expose a production-like renderer test mode'
  );
}

function run() {
  for (const filePath of requiredFiles) {
    assertFileExists(filePath);
    assertSyntax(filePath);
  }

  assertMainReferencesPreload();
  assertPolicyBehavior();

  console.log('Electron smoke check passed');
}

run();
