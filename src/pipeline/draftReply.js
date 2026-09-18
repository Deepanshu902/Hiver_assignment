const { generateJSON } = require('../llm/gemini');

// ponytail: inject few-shot context straight into the prompt
async function draftReply(message, intent, retrievedThreads) {
  const examples = retrievedThreads.map(t => 
    `CUSTOMER: ${t.customerMessage}\nBRAND: ${t.brandReply}`
  ).join('\n\n');

  const prompt = `
You are a brand customer support agent.
Intent: ${intent}

Here are examples of how we resolved similar issues in the past:
${examples}

Now, draft a grounded, helpful reply to this new message, matching the brand's tone.
New Message: "${message}"

Respond in JSON format: { "draftReply": "string" }
`;

  const result = await generateJSON(prompt);
  return result.draftReply;
}

module.exports = { draftReply };
