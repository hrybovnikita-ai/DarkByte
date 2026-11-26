import json
import sys

from darkbyte_memory.embed import embed_texts, rank_by_similarity
from darkbyte_memory.extract import extract_from_turn
from darkbyte_memory.redact import redact_text
from darkbyte_memory.summarize import summarize_messages


def main() -> None:
    raw = sys.stdin.read()
    if not raw.strip():
        print(json.dumps({"error": "empty input"}))
        sys.exit(1)
    payload = json.loads(raw)
    op = payload.get("op")
    try:
        if op == "embed":
            texts = [redact_text(t) for t in payload.get("texts", [])]
            print(json.dumps({"embeddings": embed_texts(texts)}))
            return
        if op == "rank":
            ranked = rank_by_similarity(
                payload.get("query", ""),
                payload.get("candidates", []),
                top_k=int(payload.get("top_k", 8)),
                min_score=float(payload.get("min_score", 0.28)),
            )
            print(json.dumps({"ranked": ranked}))
            return
        if op == "extract":
            user = redact_text(payload.get("user", ""))
            assistant = redact_text(payload.get("assistant", ""))
            print(json.dumps(extract_from_turn(user, assistant)))
            return
        if op == "summarize":
            msgs = payload.get("messages", [])
            print(json.dumps({"summary": summarize_messages(msgs)}))
            return
        if op == "redact":
            print(json.dumps({"text": redact_text(payload.get("text", ""))}))
            return
        print(json.dumps({"error": f"unknown op {op}"}))
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        sys.exit(2)


if __name__ == "__main__":
    main()