const { generateJSON } = require('../llm/gemini');
const intents = require('../taxonomy/intents');

// ponytail: one-shot prompt with JSON enforcement built into the gemini wrapper
async function classifyIntent(message) {
  const intentDesc = intents.map(i => `- ${i.id}: ${i.description}`).join('\n');
  const prompt = `
You are a customer support classifier.
Message: "${message}"

Classify into exactly one of these intents:
${intentDesc}

Respond in JSON format: { "intent": "string", "confidenceNote": "string" }
`;
  
  const result = await generateJSON(prompt);
  // Fallback if the model hallucinates an intent id
  if (!intents.find(i => i.id === result.intent)) {
    result.intent = 'general_inquiry';
  }
  return result;
}

module.exports = { classifyIntent };
