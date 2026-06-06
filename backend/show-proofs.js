const { execSync } = require('child_process');
const out = execSync('node verify-cultivation.js', { cwd: __dirname }).toString();
const jsonStart = out.indexOf('\n{');
const d = JSON.parse(out.slice(jsonStart + 1));
const proofs = Object.fromEntries(Object.entries(d).filter(([k]) => k.startsWith('proof_') || k === 'cleanup' || k === 'error'));
console.log(JSON.stringify(proofs, null, 2));
