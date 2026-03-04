#!/usr/bin/env python3
"""
每日科技资讯聚合脚本
数据来源：HackerNews Algolia API + GitHub Trending
AI 翻译：Groq API（llama-3.1-8b-instant）
"""

import os
import json
import datetime
import re
import requests

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

DOCS_DIR = "docs/daily-tech"
INDEX_FILE = f"{DOCS_DIR}/index.md"
INDEX_START_TAG = "<!-- DAILY_TECH_INDEX_START -->"
INDEX_END_TAG = "<!-- DAILY_TECH_INDEX_END -->"

HN_QUERIES = {
    "AI 动态": "AI LLM GPT Claude machine learning",
    "前端技术": "React Vue TypeScript CSS frontend",
    "后端 & 工具": "Rust Go Python backend API microservice",
}
HN_PER_SECTION = 5
GITHUB_TRENDING_N = 8


def fetch_hn_stories(query: str, n: int = 5) -> list[dict]:
    """从 HackerNews Algolia API 抓取热门文章"""
    url = "https://hn.algolia.com/api/v1/search"
    params = {
        "tags": "story",
        "query": query,
        "hitsPerPage": n,
        "numericFilters": "points>10",
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        hits = resp.json().get("hits", [])
        return [
            {
                "title": h.get("title", ""),
                "url": h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}",
                "points": h.get("points", 0),
                "comments": h.get("num_comments", 0),
            }
            for h in hits
            if h.get("title")
        ]
    except Exception as e:
        print(f"[WARN] HN fetch failed for query '{query}': {e}")
        return []


def fetch_github_trending(n: int = 8) -> list[dict]:
    """抓取 GitHub Trending 项目"""
    url = "https://github-trending-api.deno.dev/repositories"
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        repos = resp.json()[:n]
        return [
            {
                "name": r.get("name", ""),
                "author": r.get("author", ""),
                "url": r.get("url", ""),
                "description": r.get("description", ""),
                "stars": r.get("stars", 0),
                "language": r.get("language", ""),
            }
            for r in repos
        ]
    except Exception as e:
        print(f"[WARN] GitHub Trending fetch failed: {e}")
        return []


def groq_translate(texts: list[str]) -> list[str]:
    """批量翻译标题并生成一句话摘要"""
    if not GROQ_API_KEY:
        print("[WARN] GROQ_API_KEY 未设置，跳过翻译")
        return texts

    results = []
    for text in texts:
        if not text:
            results.append("")
            continue
        prompt = (
            f"将以下英文技术文章标题翻译为中文，并用一句话概括要点（30字以内），"
            f"输出格式：「中文标题 | 摘要」，不要输出其他内容。\n\n{text}"
        )
        try:
            resp = requests.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 100,
                    "temperature": 0.3,
                },
                timeout=15,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()
            results.append(content)
        except Exception as e:
            print(f"[WARN] Groq translate failed: {e}")
            results.append(text)
    return results


def groq_translate_description(text: str) -> str:
    """翻译 GitHub 项目描述"""
    if not GROQ_API_KEY or not text:
        return text
    prompt = f"将以下英文技术项目描述翻译为中文，简洁准确，不超过30字，只输出翻译结果：\n\n{text}"
    try:
        resp = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 60,
                "temperature": 0.3,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[WARN] Groq description translate failed: {e}")
        return text


def format_stars(stars) -> str:
    try:
        n = int(str(stars).replace(",", "").replace("k", "000"))
        if n >= 1000:
            return f"{n/1000:.1f}k"
        return str(n)
    except Exception:
        return str(stars)


def generate_daily_md(date_str: str, hn_sections: dict, trending: list) -> str:
    """生成每日资讯 MD 文件内容"""
    lines = [f"# 每日科技资讯 {date_str}", ""]

    for section_name, items in hn_sections.items():
        if not items:
            continue
        lines.append(f"## {section_name}")
        lines.append("")
        lines.append("| 文章 | 摘要 | 热度 |")
        lines.append("|------|------|------|")
        for item in items:
            translated = item.get("translated", item["title"])
            parts = translated.split("|", 1)
            title_zh = parts[0].strip() if len(parts) > 0 else item["title"]
            summary = parts[1].strip() if len(parts) > 1 else "-"
            url = item["url"]
            points = item.get("points", 0)
            comments = item.get("comments", 0)
            lines.append(f"| [{title_zh}]({url}) | {summary} | ⬆{points} 💬{comments} |")
        lines.append("")

    if trending:
        lines.append("## 今日 GitHub Trending")
        lines.append("")
        lines.append("| 项目 | 语言 | 描述 | Stars |")
        lines.append("|------|------|------|-------|")
        for repo in trending:
            name = repo["name"]
            author = repo["author"]
            url = repo["url"]
            desc = repo.get("desc_zh") or repo.get("description") or "-"
            stars = format_stars(repo.get("stars", 0))
            lang = repo.get("language") or "-"
            lines.append(f"| [{author}/{name}]({url}) | {lang} | {desc} | ⭐{stars} |")
        lines.append("")

    return "\n".join(lines)


def update_index(date_str: str, filename: str) -> None:
    """更新 index.md 的文章列表（保留最近 30 条）"""
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    new_entry = f"- [{date_str}](/daily-tech/{filename.replace('.md', '')})"

    start = content.find(INDEX_START_TAG)
    end = content.find(INDEX_END_TAG)
    if start == -1 or end == -1:
        print("[WARN] index.md 中未找到标记，跳过更新")
        return

    inner = content[start + len(INDEX_START_TAG):end].strip()
    # 过滤掉占位文字
    lines = [l for l in inner.splitlines() if l.strip() and not l.strip().startswith("*暂无")]
    # 防重复
    if not any(date_str in l for l in lines):
        lines.insert(0, new_entry)
    # 保留最近 30 条
    lines = lines[:30]

    new_inner = "\n" + "\n".join(lines) + "\n"
    new_content = (
        content[:start + len(INDEX_START_TAG)]
        + new_inner
        + content[end:]
    )
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)


def main():
    today = datetime.datetime.utcnow() + datetime.timedelta(hours=8)  # 北京时间
    date_str = today.strftime("%Y-%m-%d")
    filename = f"{date_str}.md"
    filepath = f"{DOCS_DIR}/{filename}"

    print(f"[INFO] 开始聚合 {date_str} 的科技资讯...")

    # 抓取 HN 各板块
    hn_sections_raw: dict[str, list] = {}
    for section, query in HN_QUERIES.items():
        print(f"[INFO] 抓取 HN [{section}]...")
        items = fetch_hn_stories(query, HN_PER_SECTION)
        hn_sections_raw[section] = items

    # 批量翻译 HN 标题
    all_titles = []
    section_ranges = {}
    cursor = 0
    for section, items in hn_sections_raw.items():
        titles = [i["title"] for i in items]
        all_titles.extend(titles)
        section_ranges[section] = (cursor, cursor + len(titles))
        cursor += len(titles)

    print(f"[INFO] 翻译 {len(all_titles)} 条 HN 标题...")
    translated_all = groq_translate(all_titles)

    hn_sections: dict[str, list] = {}
    for section, items in hn_sections_raw.items():
        start, end = section_ranges[section]
        for i, item in enumerate(items):
            item["translated"] = translated_all[start + i] if (start + i) < len(translated_all) else item["title"]
        hn_sections[section] = items

    # 抓取 GitHub Trending 并翻译描述
    print("[INFO] 抓取 GitHub Trending...")
    trending = fetch_github_trending(GITHUB_TRENDING_N)
    for repo in trending:
        desc = repo.get("description", "")
        if desc:
            repo["desc_zh"] = groq_translate_description(desc)

    # 生成 MD 文件
    os.makedirs(DOCS_DIR, exist_ok=True)
    md_content = generate_daily_md(date_str, hn_sections, trending)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[INFO] 已生成 {filepath}")

    # 更新 index.md
    update_index(date_str, filename)
    print(f"[INFO] 已更新 {INDEX_FILE}")
    print("[INFO] 完成！")


if __name__ == "__main__":
    main()
