const config = require('../config');

// ponytail: rule-based to save LLM cost. 
function decideEscalation(intent, maxRetrievalScore) {
  const escalationIntents = ['billing_dispute'];
  
  if (escalationIntents.includes(intent)) {
    return { decision: 'escalate', reason: `Intent '${intent}' requires human review.` };
  }
  
  if (maxRetrievalScore < config.ESCALATION_SIMILARITY_THRESHOLD) {
    return { decision: 'escalate', reason: `Low retrieval confidence (${maxRetrievalScore.toFixed(2)} < ${config.ESCALATION_SIMILARITY_THRESHOLD}).` };
  }
  
  return { decision: 'auto', reason: 'High confidence retrieval and safe intent.' };
}

module.exports = { decideEscalation };
