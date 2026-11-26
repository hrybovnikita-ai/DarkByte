from __future__ import annotations

from functools import lru_cache
from typing import Sequence

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


@lru_cache(maxsize=1)
def _model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer("all-MiniLM-L6-v2")


def embed_texts(texts: Sequence[str]) -> list[list[float]]:
    if not texts:
        return []
    model = _model()
    vectors = model.encode(list(texts), normalize_embeddings=True, show_progress_bar=False)
    return [v.astype(float).tolist() for v in vectors]


def rank_by_similarity(
    query: str,
    candidates: list[dict],
    *,
    top_k: int = 8,
    min_score: float = 0.28,
) -> list[dict]:
    if not query.strip() or not candidates:
        return []
    query_vec = np.array(embed_texts([query])[0], dtype=float).reshape(1, -1)
    ids: list[str] = []
    matrix_rows: list[np.ndarray] = []
    importance: list[float] = []
    for row in candidates:
        emb = row.get("embedding")
        if not emb or not isinstance(emb, list):
            continue
        ids.append(str(row["id"]))
        matrix_rows.append(np.array(emb, dtype=float))
        importance.append(float(row.get("importance") or 0.5))
    if not matrix_rows:
        return []
    mat = np.vstack(matrix_rows)
    scores = cosine_similarity(query_vec, mat)[0]
    boosted = scores + (np.array(importance, dtype=float) * 0.08)
    order = np.argsort(-boosted)[:top_k]
    out: list[dict] = []
    for idx in order:
        score = float(boosted[idx])
        if score < min_score:
            continue
        out.append({"id": ids[idx], "score": score, "similarity": float(scores[idx])})
    return out