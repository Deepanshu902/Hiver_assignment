require('dotenv').config();

module.exports = {
  // Brand target to filter from the dataset
  BRAND_NAME: 'AppleSupport',

  MODEL_NAME: 'gemini-3.5-flash',
  EMBED_MODEL_NAME: 'gemini-embedding-2',

  TOP_K_RETRIEVAL: 3,

  // Rule-based escalation: escalate if best retrieved thread is below this similarity
  ESCALATION_SIMILARITY_THRESHOLD: 0.65
};
