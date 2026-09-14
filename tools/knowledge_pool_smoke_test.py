#!/usr/bin/env python3
"""
Zhihu Hackathon Knowledge Pool Smoke Test
Skill version target: 0.7.2-beta.20260911131715

No authentication is sent to the hackathon knowledge endpoints.
This script never crawls arbitrary Zhihu pages.
"""
from __future__ import annotations

import argparse, collections, hashlib, json, re, statistics, sys, time
from pathlib import Path
from typing import Any
import requests

BASE = "https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge"
LIST_URL = f"{BASE}/list"
DETAIL_URL = f"{BASE}/{{work_id}}"
WORK_ID_RE = re.compile(r"^[^/?#\r\n]+$")

ACTION_HINTS = [
    "步骤","首先","然后","最后","检查","确认","建议","注意","准备","如果",
    "需要","可以","方法","操作","设置","选择","避免","完成","处理","尝试","核对"
]

def dump(path: Path, obj: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def heuristic_actionability(text: str) -> dict:
    hits = {k: text.count(k) for k in ACTION_HINTS if k in text}
    score = min(100, sum(hits.values()) * 5)
    return {"heuristicScore": score, "hits": hits}

def fetch_json(session: requests.Session, url: str, timeout: int) -> Any:
    r = session.get(url, headers={"Accept": "application/json"}, timeout=timeout)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code} for {url}: {r.text[:300]}")
    try:
        return r.json()
    except Exception as e:
        raise RuntimeError(f"Invalid JSON for {url}: {e}") from e

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="./smoke_out")
    ap.add_argument("--limit", type=int, default=0,
                    help="0 = all list items; otherwise fetch at most N details")
    ap.add_argument("--timeout", type=int, default=15)
    ap.add_argument("--sleep-ms", type=int, default=80,
                    help="small polite delay between detail requests")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    session = requests.Session()

    print(f"[1/4] GET {LIST_URL}")
    items = fetch_json(session, LIST_URL, args.timeout)
    if not isinstance(items, list):
        raise RuntimeError(f"Expected list response, got {type(items).__name__}")
    dump(out/"knowledge-list.json", items)

    selected = items if args.limit <= 0 else items[:args.limit]
    details = []
    errors = []

    print(f"[2/4] Fetching details: {len(selected)} / {len(items)}")
    for idx, item in enumerate(selected, 1):
        work_id = str(item.get("work_id") or "")
        if not work_id or not WORK_ID_RE.fullmatch(work_id):
            errors.append({"work_id": work_id, "error": "invalid_work_id", "item": item})
            continue
        try:
            detail = fetch_json(session, DETAIL_URL.format(work_id=work_id), args.timeout)
            details.append(detail)
            dump(out/"details"/f"{work_id}.json", detail)
            print(f"  [{idx}/{len(selected)}] OK {work_id}")
        except Exception as e:
            errors.append({"work_id": work_id, "error": str(e)})
            print(f"  [{idx}/{len(selected)}] ERROR {work_id}: {e}", file=sys.stderr)
        time.sleep(max(0, args.sleep_ms) / 1000)

    print("[3/4] Analysing pool")
    labels = collections.Counter()
    lengths = []
    complete = 0
    full_source = 0
    bounded_excerpt = 0
    missing = collections.Counter()
    candidates = []

    for d in details:
        for key in ["work_id","chapter_name","author_name","labels","introduction","content"]:
            if d.get(key) in (None, "", []):
                missing[key] += 1

        for label in d.get("labels") or []:
            labels[str(label)] += 1

        body = d.get("content")
        if isinstance(body, str) and body.strip():
            complete += 1
            body_len = len(body.strip())
            lengths.append(body_len)
            h = heuristic_actionability(body)
            candidate = {
                "work_id": str(d.get("work_id") or ""),
                "title": d.get("chapter_name"),
                "author": d.get("author_name"),
                "labels": d.get("labels") or [],
                "contentLength": body_len,
                "contentHash": content_hash(body),
                "sourceScopeType": "full" if body_len < 3000 else "bounded_excerpt",
                "eligibleForCompiler": True,
                "publishingDisclosureRequired": body_len >= 3000,
                **h
            }
            candidates.append(candidate)
            if candidate["sourceScopeType"] == "full":
                full_source += 1
            else:
                bounded_excerpt += 1

    candidates.sort(key=lambda x: (-x["heuristicScore"], -x["contentLength"]))
    report = {
        "skillTarget": "0.5.3-beta.20260904115023",
        "poolSize": len(items),
        "detailsRequested": len(selected),
        "detailsSucceeded": len(details),
        "detailsFailed": len(errors),
        "fullContentRateAmongFetched": (complete / len(details)) if details else 0,
        "fullSourceCount": full_source,
        "boundedExcerptCount": bounded_excerpt,
        "compilerEligibleCount": full_source + bounded_excerpt,
        "contentLength": {
            "min": min(lengths) if lengths else 0,
            "median": statistics.median(lengths) if lengths else 0,
            "mean": statistics.mean(lengths) if lengths else 0,
            "max": max(lengths) if lengths else 0,
        },
        "topLabels": labels.most_common(30),
        "missingFields": dict(missing),
        "topHeuristicCandidates": candidates[:30],
        "errors": errors,
        "note": (
            "heuristicScore only detects action-language hints. "
            "It is NOT the final LLM Executability Judge and must not be used as a product score."
        )
    }
    dump(out/"smoke-report.json", report)
    dump(out/"candidate-summary.json", candidates)

    md = []
    md.append("# Knowledge Pool Smoke Test\n")
    md.append(f"- Pool size: **{report['poolSize']}**")
    md.append(f"- Details succeeded: **{report['detailsSucceeded']}**")
    md.append(f"- Details failed: **{report['detailsFailed']}**")
    md.append(f"- Full content rate (fetched): **{report['fullContentRateAmongFetched']:.1%}**")
    md.append(f"- Median content length: **{report['contentLength']['median']} chars**")
    md.append(f"- Full Source (`<3000` chars): **{report['fullSourceCount']}**")
    md.append(f"- Official bounded excerpt (`>=3000` chars): **{report['boundedExcerptCount']}**")
    md.append(f"- Compiler-eligible source scopes: **{report['compilerEligibleCount']}**")
    md.append("- Bounded excerpts may only produce disclosed Supporting Runs; they cannot be used as the Hero or described as the whole article.")
    md.append("\n## Top labels")
    for label, n in report["topLabels"][:15]:
        md.append(f"- {label}: {n}")
    md.append("\n## Heuristic candidates (NOT final Judge)")
    for c in candidates[:15]:
        md.append(
            f"- `{c['work_id']}` {c.get('title') or '(untitled)'} "
            f"— {c['sourceScopeType']}, heuristic {c['heuristicScore']}, {c['contentLength']} chars"
        )
    (out/"smoke-report.md").write_text("\n".join(md)+"\n", encoding="utf-8")

    print("[4/4] Done")
    print(f"Report: {out/'smoke-report.json'}")
    print(f"Markdown: {out/'smoke-report.md'}")

if __name__ == "__main__":
    main()
