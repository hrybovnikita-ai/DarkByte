# DARKBYTE AI memory (Python)

Local embeddings and NLP helpers for chat memory. Not required in CI — the server falls back to TypeScript embeddings when Python is unavailable.

## Setup

```bash
cd python
pip install -r requirements-memory.txt
```

From the `necrobyte` root, the server invokes:

```bash
python -m darkbyte_memory
```

Set `MEMORY_PYTHON` in `.env.local` if your Python executable has another name.

## Operations (stdin JSON)

- `embed` — batch sentence embeddings (384-d, `all-MiniLM-L6-v2`)
- `rank` — cosine similarity ranking with scikit-learn
- `extract` — preference / fact heuristics (+ forget detection)
- `summarize` — extractive conversation summary
- `redact` — strip likely secrets before storage