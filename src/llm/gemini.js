const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

// ponytail: failing fast if no key instead of obscuring it.
if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateJSON(prompt, retries = 1) {
  const model = genAI.getGenerativeModel({ model: config.MODEL_NAME });
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return JSON.parse(result.response.text());
  } catch (err) {
    if (retries > 0) {
      console.warn(`[gemini] generation failed, retrying... (${err.message})`);
      await delay(2000);
      return generateJSON(prompt, retries - 1);
    }
    throw err;
  }
}

async function embed(text) {
  const model = genAI.getGenerativeModel({ model: config.EMBED_MODEL_NAME });
  // ponytail: implicit small delay to help with free-tier rate limits instead of complex queueing
  await delay(500); 
  const result = await model.embedContent(text);
  return result.embedding.values;
}

module.exports = { generateJSON, embed };
