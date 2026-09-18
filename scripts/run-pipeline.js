const fs = require('fs');
const path = require('path');
const { runAgent } = require('../src/pipeline/runAgent');

async function main() {
  const embeddingsPath = path.join(__dirname, '../data/processed/embeddings.json');
  const threadsPath = path.join(__dirname, '../data/processed/threads.json');
  
  if (!fs.existsSync(embeddingsPath) || !fs.existsSync(threadsPath)) {
    console.error('Run prepare-data and build-embeddings first.');
    process.exit(1);
  }

  const cachedEmbeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
  const threads = JSON.parse(fs.readFileSync(threadsPath, 'utf-8'));
  const threadsMap = new Map(threads.map(t => [t.threadId, t]));

  // Test with one dummy message
  const testMessage = "I got overcharged on my last bill, fix it now!";
  
  console.log(`Running agent pipeline on test message: "${testMessage}"...`);
  const result = await runAgent(testMessage, cachedEmbeddings, threadsMap);
  
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
