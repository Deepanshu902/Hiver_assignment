const fs = require('fs');
const { parse } = require('csv-parse');
const config = require('../config');

// ponytail: load whole CSV stream, index by tweet_id.
// # ponytail: memory ceiling hit if CSV is massive (Kaggle dataset is 3M rows). For demo, assume twcs.csv is a sample. If 3M, use database or chunking.
async function reconstructThreads(csvPath) {
  const tweets = new Map();
  
  const parser = fs.createReadStream(csvPath).pipe(parse({ columns: true, skip_empty_lines: true }));
  
  for await (const row of parser) {
    tweets.set(row.tweet_id, row);
  }

  const threads = [];
  
  // Find all outbound brand tweets that resolve a thread
  for (const [id, tweet] of tweets) {
    if (tweet.author_id === config.BRAND_NAME && tweet.inbound === 'False') {
      // Trace back to the original customer tweet
      let current = tweet;
      let firstCustomerMessage = null;
      
      while (current && current.in_response_to_tweet_id) {
        const parent = tweets.get(current.in_response_to_tweet_id);
        if (!parent) break; // Incomplete thread
        
        if (parent.inbound === 'True' && parent.author_id !== config.BRAND_NAME) {
          firstCustomerMessage = parent;
        }
        current = parent;
      }
      
      if (firstCustomerMessage) {
        threads.push({
          threadId: tweet.tweet_id, // Use brand's final reply ID as thread ID
          brand: config.BRAND_NAME,
          customerMessage: firstCustomerMessage.text,
          brandReply: tweet.text,
          createdAt: tweet.created_at
        });
      }
    }
  }

  // Deduplicate on customer message (in case multiple brand replies traced back to same origin)
  const uniqueThreads = [];
  const seen = new Set();
  for (const t of threads) {
    if (!seen.has(t.customerMessage)) {
      seen.add(t.customerMessage);
      uniqueThreads.push(t);
    }
  }

  return uniqueThreads;
}

module.exports = { reconstructThreads };
