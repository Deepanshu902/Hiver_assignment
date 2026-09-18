# Support Agent Pipeline — Design Specification

## 1. Overview
A batch pipeline built in Node.js that processes customer tweets for a specific brand, classifies intent, retrieves how the brand resolved similar past issues, drafts a grounded reply, and decides whether to auto-handle or escalate with a reason. The pipeline's performance is then evaluated against a hand-labeled golden dataset and two baseline models (trivial and simple) using both standard metrics and an LLM-as-a-judge.

## 2. System Architecture

The system operates in three main phases:

### Phase 1: Data Preparation
- **Raw Input:** `twcs.csv` (Kaggle dataset) stored in `data/raw/`.
- **Thread Reconstruction:** Extract inbound customer tweets and corresponding outbound brand responses. Multi-turn threads are resolved by taking the first customer message and the brand's final resolving reply.
- **Output:** Cached threads in `data/processed/threads.json`.
- **Embeddings Cache:** Generated using Google Gemini `text-embedding-004` and saved to `data/processed/embeddings.json` to avoid redundant API calls.

### Phase 2: Agent Pipeline (Per-Message Flow)
For each message, the agent executes four sequential steps:
1. **Classify Intent:** Uses `gemini-2.0-flash` to classify the message into a predefined (hand-crafted) taxonomy of 6-8 intents. Outputs structured JSON `{ intent, confidenceNote }`.
2. **Retrieve Similar Threads:** Embeds the input message and uses cosine similarity to retrieve the top-k (e.g., k=3) historical resolved threads for that brand.
3. **Draft Reply:** Uses `gemini-2.0-flash` prompted with the input message, classified intent, and retrieved examples to draft a contextually grounded reply.
4. **Decide Escalation:** A deterministic, rule-based step that evaluates the retrieval similarity score and the predicted intent to decide whether to `auto` or `escalate`, and provides a `reason`.

### Phase 3: Evaluation Harness
- **Baselines:**
  - *Trivial:* Always predicts majority-class intent, returns a generic reply, and escalates.
  - *Simple:* Keyword/regex-based intent classification, template replies, escalates if no keywords match.
- **Metrics:** Custom scripts calculate accuracy, per-class F1 score, and generate a confusion matrix against a hand-labeled golden dataset (`data/golden/golden_set.json`).
- **LLM Judge:** Evaluates generated replies based on a custom rubric (e.g., grounding, tone match, lack of hallucination).
- **Agreement Check:** Human validation against a random 30-40 sample of the LLM judge's scores.

## 3. Module Design

The codebase uses CommonJS modules without TypeScript.

- **`src/llm/gemini.js`:** The single integration point for Google Gemini. Exports `generateJSON(prompt, schemaHint)` and `embed(text)`. Includes rate-limiting/retries to handle free-tier API quotas.
- **`src/data/`:** Contains `loadDataset.js`, `filterBrand.js`, and `reconstructThreads.js`.
- **`src/taxonomy/intents.js`:** Static array defining the intents taxonomy.
- **`src/pipeline/`:** Contains the modular steps (`classifyIntent.js`, `retrieveSimilar.js`, `draftReply.js`, `decideEscalation.js`) and `runAgent.js` which orchestrates them.
- **`src/baselines/`:** Implementations for `trivialBaseline.js` and `simpleBaseline.js`.
- **`src/eval/`:** Contains `metrics.js` (manual math calculations), `llmJudge.js`, `judgeAgreement.js`, and `runEval.js` for orchestration.
- **`scripts/`:** Entry points for executing the workflow (`prepare-data.js`, `build-embeddings.js`, `run-pipeline.js`, `run-eval.js`).

## 4. Key Decisions & Trade-offs
- **LLM Wrapper Isolation:** All external LLM calls route through a single file (`gemini.js`). This enables easy model swapping and centralized error handling (retries/throttling).
- **Rule-based Escalation:** Decision to escalate is handled by a deterministic rule based on similarity and intent rather than an LLM prompt. This minimizes cost, latency, and maximizes explainability.
- **Multi-turn Thread Handling:** Truncates complex interactions to the first question and final answer for simplicity and clear retrieval grounding.
- **API Throttling:** Small delays are injected during batch processing to avoid hitting Gemini free-tier rate limits.
