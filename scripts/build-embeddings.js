require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { embed } = require('../src/llm/gemini');

async function main() {
  const threadsPath = path.join(__dirname, '../data/processed/threads.json');
  const outPath = path.join(__dirname, '../data/processed/embeddings.json');
  
  if (!fs.existsSync(threadsPath)) {
    console.error(`[error] ${threadsPath} not found. Run prepare-data.js first.`);
    process.exit(1);
  }

  const threads = JSON.parse(fs.readFileSync(threadsPath, 'utf-8')).slice(0, 500);
  const embeddings = [];

  console.log(`Generating embeddings for ${threads.length} threads...`);
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i];
    // ponytail: embed only the customer message for retrieval matching against new customer messages
    const vector = await embed(t.customerMessage);
    embeddings.push({ threadId: t.threadId, vector });
    console.log(`Embedded ${i + 1}/${threads.length}`);
  }

  fs.writeFileSync(outPath, JSON.stringify(embeddings, null, 2));
  console.log(`Saved embeddings to ${outPath}`);
}

main().catch(console.error);
