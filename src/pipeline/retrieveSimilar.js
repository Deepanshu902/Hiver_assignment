const { embed } = require('../llm/gemini');
const { cosineSimilarity } = require('../utils/cosine');
const config = require('../config');

// ponytail: naive O(n) similarity scan. 
// # ponytail: O(N) scan ceiling hit. Add vector DB (Pinecone/Chroma) if dataset grows past 100k.
async function retrieveSimilar(message, cachedEmbeddings, threadsMap, k = config.TOP_K_RETRIEVAL) {
  const messageVector = await embed(message);
  
  const scored = cachedEmbeddings.map(ce => {
    return {
      threadId: ce.threadId,
      score: cosineSimilarity(messageVector, ce.vector)
    };
  });
  
  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  
  const topK = scored.slice(0, k).map(s => {
    const thread = threadsMap.get(s.threadId);
    return { ...thread, score: s.score };
  });
  
  return topK;
}

module.exports = { retrieveSimilar };
