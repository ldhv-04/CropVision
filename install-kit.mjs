import { readFileSync, mkdirSync, copyFileSync, existsSync, rmSync, cpSync, writeFileSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const TMPDIR = process.env.TEMP + '\\vc-kit-install';
const PROJECT_ROOT = process.cwd();
const BACKUP_DIR = '.vibecode-backup';

// Read manifest and resolve
const manifest = JSON.parse(readFileSync(join(TMPDIR, 'vc-manifest.json'), 'utf8'));
const resolvedJson = execSync(`node "${join(TMPDIR, 'resolve-manifest.mjs')}" --root "${TMPDIR}" --json`, { encoding: 'utf8' });
const resolved = JSON.parse(resolvedJson);

console.log('\n  vibecode-pro-max-kit installer (Windows)');
console.log('  ─────────────────────────────────────────');
console.log(`  Kit version: ${manifest.version || 'unknown'}`);

// Backup existing setup
let hasExisting = false;
const backupTargets = ['.claude', '.codex', '.agents', 'CLAUDE.md', 'AGENTS.md', 'GUIDE.md'];
for (const target of backupTargets) {
  const fullPath = join(PROJECT_ROOT, target);
  if (existsSync(fullPath)) {
    if (!hasExisting) {
      hasExisting = true;
      console.log('\n  Existing setup detected. Backing up...');
      mkdirSync(join(PROJECT_ROOT, BACKUP_DIR), { recursive: true });
    }
    const dest = join(PROJECT_ROOT, BACKUP_DIR, target);
    if (statSync(fullPath).isDirectory()) {
      cpSync(fullPath, dest, { recursive: true });
    } else {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(fullPath, dest);
    }
    console.log(`    Backed up ${target}`);
    rmSync(fullPath, { recursive: true, force: true });
  }
}

// Install files
let installed = 0;
let skippedMerge = 0;
let skippedCopyIfMissing = 0;

console.log('\n  Installing files...');

for (const file of resolved.files) {
  const srcPath = join(TMPDIR, file);
  const destPath = join(PROJECT_ROOT, file);
  
  if (resolved.merge.includes(file) && existsSync(destPath)) {
    skippedMerge++;
    continue;
  }
  
  if (resolved.copyIfMissing.includes(file) && existsSync(destPath)) {
    skippedCopyIfMissing++;
    continue;
  }
  
  if (!existsSync(srcPath)) continue;
  
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(srcPath, destPath);
  installed++;
}

// Symlinks
console.log('  Setting up symlinks...');
for (const [linkPath, linkTarget] of Object.entries(resolved.symlinks)) {
  const fullLinkPath = join(PROJECT_ROOT, linkPath);
  const fullTarget = join(dirname(fullLinkPath), linkTarget);
  mkdirSync(dirname(fullLinkPath), { recursive: true });
  if (existsSync(fullLinkPath)) {
    rmSync(fullLinkPath, { recursive: true, force: true });
  }
  try {
    execSync(`cmd /c mklink /J "${fullLinkPath}" "${fullTarget}"`, { stdio: 'pipe' });
  } catch (e) {
    console.log(`    Warning: Could not create symlink for ${linkPath}`);
  }
}

// Write version files
writeFileSync(join(PROJECT_ROOT, '.vc-installed-files'), resolved.files.join('\n'));
writeFileSync(join(PROJECT_ROOT, '.vc-version'), manifest.version || 'unknown');

// Count
const agentDir = join(PROJECT_ROOT, '.claude', 'agents');
const skillDir = join(PROJECT_ROOT, '.claude', 'skills');
const hookDir = join(PROJECT_ROOT, '.claude', 'hooks');
const agentCount = existsSync(agentDir) ? readdirSync(agentDir).filter(f => f.endsWith('.md')).length : 0;
const skillCount = existsSync(skillDir) ? readdirSync(skillDir).filter(f => { try { return statSync(join(skillDir, f)).isDirectory(); } catch { return false; } }).length : 0;
const hookCount = existsSync(hookDir) ? readdirSync(hookDir).filter(f => f.endsWith('.cjs')).length : 0;

console.log(`\n  Install complete. (v${manifest.version || 'unknown'})`);
console.log(`\n    Agents:     ${agentCount} (Claude Code + Codex)`);
console.log(`    Skills:     ${skillCount}`);
console.log(`    Hooks:      ${hookCount}`);
console.log(`    Files:      ${installed} installed`);
if (skippedMerge > 0) console.log(`    Merge:      ${skippedMerge} preserved (user config)`);
if (skippedCopyIfMissing > 0) console.log(`    Existing:   ${skippedCopyIfMissing} skipped (already present)`);
if (hasExisting) {
  console.log(`\n  Previous setup backed up to ${BACKUP_DIR}/`);
  console.log('  Your process/ directory was preserved (plans, context, features).');
}
console.log('\n  Done!');
console.log('');