const { generateJSON } = require('../llm/gemini');

// ponytail: single LLM call for all rubric criteria to save tokens/time
async function judgeReply(message, generatedReply) {
  const prompt = `
Evaluate the customer support reply based on this message:
Message: "${message}"
Generated Reply: "${generatedReply}"

Rate the reply from 1 to 5 on the following criteria:
1. Tone (Professional and empathetic)
2. Hallucination (Doesn't promise things it can't verify)
3. Actionability (Provides clear next steps)

Return JSON format: 
{ 
  "score": number (1-5 average),
  "rationale": "string" 
}
`;
  return await generateJSON(prompt);
}

module.exports = { judgeReply };
