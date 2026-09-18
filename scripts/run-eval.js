const fs = require('fs');
const path = require('path');
const { runAgent } = require('../src/pipeline/runAgent');
const { runTrivialBaseline } = require('../src/baselines/trivialBaseline');
const { runSimpleBaseline } = require('../src/baselines/simpleBaseline');
const { computeAccuracy, computeF1PerClass, computeConfusionMatrix } = require('../src/eval/metrics');
const { judgeReply } = require('../src/eval/llmJudge');

async function main() {
  const outDir = path.join(__dirname, '../results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const goldenSetPath = path.join(__dirname, '../data/golden/golden_set.json');
  if (!fs.existsSync(goldenSetPath)) {
    console.error(`[error] Golden set not found at ${goldenSetPath}.`);
    process.exit(1);
  }
  const goldenSet = JSON.parse(fs.readFileSync(goldenSetPath, 'utf-8'));

  const embeddingsPath = path.join(__dirname, '../data/processed/embeddings.json');
  const threadsPath = path.join(__dirname, '../data/processed/threads.json');
  
  if (!fs.existsSync(embeddingsPath) || !fs.existsSync(threadsPath)) {
    console.error('[error] embeddings.json or threads.json not found. Run prepare-data and build-embeddings first.');
    process.exit(1);
  }

  const cachedEmbeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
  const threads = JSON.parse(fs.readFileSync(threadsPath, 'utf-8'));
  const threadsMap = new Map(threads.map(t => [t.threadId, t]));

  const predictions = [];
  const trivialPredictions = [];
  const simplePredictions = [];
  const judgeResults = [];

  console.log('Running eval over the full golden set (105 items). This will take ~30 minutes due to API rate limits...');
  for (const gold of goldenSet) {
    console.log(`Evaluating tweet ID: ${gold.id}`);
    // 2. Run Agent
    const agentOut = await runAgent(gold.message, cachedEmbeddings, threadsMap);
    predictions.push(agentOut);
    
    // 3. Run Baselines
    trivialPredictions.push(runTrivialBaseline(gold.message));
    simplePredictions.push(runSimpleBaseline(gold.message));
    
    // 4. LLM Judge
    const judgeOut = await judgeReply(gold.message, agentOut.draftReply);
    judgeResults.push({ id: gold.id, score: judgeOut.score, rationale: judgeOut.rationale });

    console.log('Waiting 15 seconds to respect Gemini 5 RPM rate limit...');
    await new Promise(r => setTimeout(r, 15000));
  }

  // 5. Calculate Metrics
  const results = {
    agent: {
      accuracy: computeAccuracy(predictions, goldenSet),
      f1: computeF1PerClass(predictions, goldenSet),
      confusion: computeConfusionMatrix(predictions, goldenSet)
    },
    trivial: {
      accuracy: computeAccuracy(trivialPredictions, goldenSet)
    },
    simple: {
      accuracy: computeAccuracy(simplePredictions, goldenSet)
    },
    judgeAverages: judgeResults.reduce((acc, r) => acc + r.score, 0) / judgeResults.length
  };

  fs.writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outDir, 'judge_results.json'), JSON.stringify(judgeResults, null, 2));
  
  console.log('Evaluation complete! Check results/metrics.json');
}

main().catch(console.error);
