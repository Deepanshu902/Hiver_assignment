const { classifyIntent } = require('./classifyIntent');
const { retrieveSimilar } = require('./retrieveSimilar');
const { draftReply } = require('./draftReply');
const { decideEscalation } = require('./decideEscalation');

async function runAgent(message, cachedEmbeddings, threadsMap) {
  const startTime = Date.now();
  
  const { intent, confidenceNote } = await classifyIntent(message);
  
  const retrieved = await retrieveSimilar(message, cachedEmbeddings, threadsMap);
  const maxScore = retrieved.length > 0 ? retrieved[0].score : 0;
  
  const replyText = await draftReply(message, intent, retrieved);
  
  const { decision, reason } = decideEscalation(intent, maxScore);
  
  return {
    message,
    predictedIntent: intent,
    retrievedThreadIds: retrieved.map(t => t.threadId),
    draftReply: replyText,
    decision,
    reason,
    modelLatencyMs: Date.now() - startTime
  };
}

module.exports = { runAgent };
