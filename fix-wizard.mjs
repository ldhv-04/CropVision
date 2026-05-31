import { readFileSync, writeFileSync } from 'fs';

const filePath = 'App/app/(agrivision)/fields.js';
let c = readFileSync(filePath, 'utf8');

// Find the handleResetWizard function and split it
const marker = '  const handleResetWizard = () => {';
const idx = c.indexOf(marker);
if (idx === -1) {
  console.log('handleResetWizard not found!');
  process.exit(1);
}

// Find the closing of handleResetWizard (the }; after onClose())
const afterMarker = c.substring(idx);
const closeIdx = afterMarker.indexOf('  };');
const funcEnd = idx + closeIdx + 4; // 4 = '  };'.length

const oldFunc = c.substring(idx, funcEnd);
console.log('Found function at index', idx, 'length', oldFunc.length);

const newCode = `  const resetWizardState = () => {
    setStep(1);
    setName('');
    setCropType('L\u00fa');
    setArea('');
    setLatitude('16.0535');
    setLongitude('108.2045');
    setPlantingDate('2026-03-15');
    setBoundary(null);
    setWalkedPoints([]);
    setIsStreaming(false);
    setWizardSubZones([]);
    setNewSzBoundary(null);
  };

  // Reset wizard state every time modal opens
  useEffect(() => {
    if (visible) {
      resetWizardState();
    }
  }, [visible]);

  const handleResetWizard = () => {
    resetWizardState();
    onClose();
  };`;

c = c.substring(0, idx) + newCode + c.substring(funcEnd);
writeFileSync(filePath, c, 'utf8');
console.log('Replacement done!');