// ponytail: handcrafted metrics, no dependencies
function computeAccuracy(predictions, goldTruths, key = 'predictedIntent', truthKey = 'trueIntent') {
  if (predictions.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i][key] === goldTruths[i][truthKey]) correct++;
  }
  return correct / predictions.length;
}

function computeF1PerClass(predictions, goldTruths, key = 'predictedIntent', truthKey = 'trueIntent') {
  const stats = {};
  
  goldTruths.forEach((g, i) => {
    const truth = g[truthKey];
    const pred = predictions[i][key];
    
    if (!stats[truth]) stats[truth] = { tp: 0, fp: 0, fn: 0 };
    if (!stats[pred]) stats[pred] = { tp: 0, fp: 0, fn: 0 };
    
    if (pred === truth) {
      stats[truth].tp++;
    } else {
      stats[pred].fp++;
      stats[truth].fn++;
    }
  });

  const f1Scores = {};
  for (const [cls, counts] of Object.entries(stats)) {
    const precision = counts.tp / (counts.tp + counts.fp) || 0;
    const recall = counts.tp / (counts.tp + counts.fn) || 0;
    const f1 = (precision + recall) === 0 ? 0 : 2 * (precision * recall) / (precision + recall);
    f1Scores[cls] = { precision, recall, f1 };
  }
  return f1Scores;
}

function computeConfusionMatrix(predictions, goldTruths, key = 'predictedIntent', truthKey = 'trueIntent') {
  const matrix = {};
  goldTruths.forEach((g, i) => {
    const truth = g[truthKey];
    const pred = predictions[i][key];
    if (!matrix[truth]) matrix[truth] = {};
    if (!matrix[truth][pred]) matrix[truth][pred] = 0;
    matrix[truth][pred]++;
  });
  return matrix;
}

module.exports = { computeAccuracy, computeF1PerClass, computeConfusionMatrix };
