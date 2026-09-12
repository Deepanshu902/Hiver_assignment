# Hiver Support Agent Pipeline

This repository contains an end-to-end AI support agent built for `AppleSupport` using the Kaggle Customer Support on Twitter dataset. It classifies intent, retrieves past resolved threads via cosine similarity, drafts a grounded reply, and decides whether to auto-handle or escalate the ticket.

## Quickstart (Reproduce in under 15 minutes)

**1. Install Dependencies & Configure**
```bash
npm install
# Ensure your .env file has GEMINI_API_KEY=your_key
```

**2. Prepare the Data**
Drop the raw Kaggle `twcs.csv` into `data/raw/twcs.csv`, then run:
```bash
# Parses CSV, filters for AppleSupport, and reconstructs multi-turn threads
node scripts/prepare-data.js
```

**3. Build the Vector Database**
```bash
# Generates gemini-embedding-2 vectors for all resolved threads
node scripts/build-embeddings.js
```
*(Note: To run in under 15 minutes on a free-tier API, the script limits the database to the first 500 threads).*

**4. Run the Evaluation Harness**
```bash
# Evaluates the agent against the hand-labeled golden set and 2 baselines
node scripts/run-eval.js
```
*Results will be immediately available in `results/metrics.json` and `results/judge_results.json`.*

---

# Evaluation Report

## 1. Problem Framing
For AppleSupport, "good" means high technical accuracy and strict avoidance of false promises (hallucinations). A customer with a broken device does not want a generic apology; they want specific diagnostic steps or a direct link to a human. 
**What I chose not to build:** I chose not to build an LLM-based escalation router. Instead, I built a zero-cost, highly explainable rule-based router that automatically escalates high-risk intents (e.g., billing disputes) or when retrieval similarity is below a safe threshold.

## 2. Golden Evaluation Set
The golden set (`data/golden/golden_set.json`) consists of 105 manually sampled tweets. I randomly sampled rows from the raw CSV, specifically selecting a mix of obvious inquiries and ambiguous complaints. I hand-labeled the `trueIntent` according to a rigid 6-class taxonomy and assigned an `expectedDecision` based on severity.

## 3. Results vs. Baselines
*(NOTE: Fill these in after your final run!)*
- **Trivial Baseline (Always predict 'general_inquiry', always escalate):** `[FILL IN ACCURACY]%`
- **Simple Baseline (Regex keyword matching):** `[FILL IN ACCURACY]%`
- **Agent Accuracy:** `[FILL IN ACCURACY]%`
- **Agent F1 Score:** `[FILL IN MACRO-AVERAGE F1]%`
- **LLM Judge Average Score (out of 5):** `[FILL IN JUDGE SCORE]`

## 4. Failure Analysis: Top Failure Modes
*(NOTE: Review your judge_results.json and confusion matrix to adjust these!)*
1. **Ambiguous Complaints:** Customers tweeting "This is ridiculous" without context. The agent defaults to `general_inquiry` but humans might label it `technical_issue`.
2. **Sarcasm Detection:** Customers saying "Great job Apple, another broken update." The agent might miss the sarcasm and fail to escalate immediately.
3. **Multi-intent Tweets:** "My bill is wrong and my screen is cracked." The agent only predicts one intent, dropping the secondary issue.
4. **Retrieval Starvation:** If a highly specific obscure bug is asked about, but isn't in the 500-item vector database, the agent drafts a generic reply.
5. **Over-cautious Escalation:** The strict rule-based similarity threshold (`0.65`) sometimes escalates tickets that the LLM actually drafted a perfect reply for, hurting auto-resolution rates.

## 5. What is misleading about my headline number?
The headline accuracy/F1 score is misleading because it grades the agent on a heavily imbalanced golden set that favors standard technical issues. Furthermore, the LLM-as-a-judge score (e.g., 4.8/5) is inherently biased—Gemini is grading its own outputs. It naturally prefers its own stylistic tone. A human evaluating the same replies might rate them lower for sounding "too robotic."

## 6. What I'd do next with one more week
1. **Switch to a dedicated Vector DB:** Move from in-memory JSON matching to Milvus or Pinecone for O(1) latency on millions of threads.
2. **Implement Few-Shot Classification:** Add historical examples into the classification prompt, not just the drafting prompt.
3. **Multi-turn Context:** Currently, we only evaluate the first tweet. I would extend the pipeline to handle entire multi-turn thread arrays.

## 7. Decision Log (Non-obvious decisions & Why)
- **Zero-dependency Math:** Hand-rolled the Cosine Similarity function instead of importing heavy libraries like `math.js` to ensure the core matching logic is 100% transparent and explainable.
- **Rule-based Escalation:** Hardcoded the escalation decision instead of using an LLM to save token costs and guarantee that 100% of billing issues are escalated.
- **Aggregated Taxonomy:** Reduced 77 potential HuggingFace intents down to a core 6 specific to brand support to prevent classification fragmentation.
- **Two-Step Prompting:** Separated Intent Classification and Reply Drafting into two sequential API calls rather than one massive prompt to reduce hallucinations and ensure retrieval happens *between* the steps.
- **Asymmetric Retrieval:** Embedded only the *customer's* message in the vector database, rather than the brand's reply, because inbound customer tweets are semantically closer to past inbound customer tweets.
- **Rate-limit Backoffs:** Intentionally injected 15-second delays in the evaluation loop to gracefully handle free-tier API limits without crashing the batch job.
- **Dropped Sub-brands:** Filtered exclusively for `@AppleSupport` to ensure the retrieved historical context was stylistically consistent.
- **Trivial Baseline Choice:** Chose "Majority Class prediction + Always Escalate" as the trivial baseline because it represents what a company does before having AI (route everything to a human).
- **LLM Judge Rubric:** Forced the judge to score on exactly 3 axes (Tone, Hallucination, Actionability) to prevent it from handing out arbitrary 5/5 scores.
- **No LangChain/LlamaIndex:** Avoided massive orchestration frameworks to keep the architecture "bare metal", proving a fundamental understanding of how the RAG pipeline actually works.
