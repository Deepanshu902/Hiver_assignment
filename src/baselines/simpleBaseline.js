// ponytail: basic regex routing.
function runSimpleBaseline(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('refund') || lower.includes('charge') || lower.includes('bill')) {
    return {
      predictedIntent: 'billing_dispute',
      draftReply: 'We understand you have a billing concern. Let us look into your account.',
      decision: 'escalate',
      reason: 'Rule matched billing keywords.'
    };
  }
  if (lower.includes('broken') || lower.includes('bug') || lower.includes('crash')) {
    return {
      predictedIntent: 'technical_issue',
      draftReply: 'Please try restarting your device. If the issue persists, let us know.',
      decision: 'auto',
      reason: 'Rule matched tech issue.'
    };
  }
  
  return {
    predictedIntent: 'general_inquiry',
    draftReply: 'Thanks for contacting us. How can we help?',
    decision: 'escalate',
    reason: 'No keywords matched.'
  };
}
module.exports = { runSimpleBaseline };
