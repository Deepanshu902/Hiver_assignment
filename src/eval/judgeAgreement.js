// ponytail: helper to dump LLM judge results vs Human blind labels for correlation
const fs = require('fs');

function checkAgreement(judgeResults, humanLabelsPath) {
  if (!fs.existsSync(humanLabelsPath)) {
    console.log('[judgeAgreement] No human labels found. Skipping agreement check.');
    return;
  }
  const humanLabels = JSON.parse(fs.readFileSync(humanLabelsPath, 'utf-8'));
  
  let exactMatches = 0;
  let total = 0;
  
  for (const res of judgeResults) {
    const humanScore = humanLabels[res.id];
    if (humanScore !== undefined) {
      total++;
      if (Math.round(res.score) === humanScore) exactMatches++;
    }
  }
  
  return total > 0 ? (exactMatches / total) : 0;
}

module.exports = { checkAgreement };
