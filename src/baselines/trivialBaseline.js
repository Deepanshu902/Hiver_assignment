// ponytail: always predict general_inquiry, canned reply, always escalate
function runTrivialBaseline(message) {
  return {
    predictedIntent: 'general_inquiry', // majority class
    draftReply: 'Thank you for reaching out. A human agent will assist you shortly.',
    decision: 'escalate',
    reason: 'Trivial baseline always escalates.'
  };
}
module.exports = { runTrivialBaseline };
