import fs from 'node:fs';

const requiredFiles = [
  'ml/policylab/engine.py',
  'ml/policylab/api.py',
  'ml/policylab/requirements.txt',
  'server/services/policyLabService.ts',
  'src/components/policy/PolicyLab.tsx',
  'src/services/policyLabApi.ts',
];

let failed = false;
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing PolicyLab file: ${file}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('PolicyLab integration files are present.');
