const fs = require('fs');
const path = require('path');
const { reconstructThreads } = require('../src/data/reconstructThreads');

async function main() {
  const rawPath = path.join(__dirname, '../data/raw/twcs.csv');
  const outDir = path.join(__dirname, '../data/processed');
  const outPath = path.join(outDir, 'threads.json');
  
  if (!fs.existsSync(rawPath)) {
    console.error(`[error] Raw dataset not found at ${rawPath}. Add your CSV and run again.`);
    process.exit(1);
  }
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Loading and reconstructing threads from ${rawPath}...`);
  const threads = await reconstructThreads(rawPath);
  
  fs.writeFileSync(outPath, JSON.stringify(threads, null, 2));
  console.log(`Saved ${threads.length} resolved threads to ${outPath}`);
}

main().catch(console.error);
