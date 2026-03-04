#!/usr/bin/env python3
"""
每日科技资讯聚合脚本
数据来源：HackerNews Algolia API + GitHub Trending + 多个 RSS 源
AI 翻译：Groq API（llama-3.1-8b-instant）
"""

import os
import json
import datetime
import re
import requests
import feedparser
import uuid
import time
from urllib.parse import quote, urlparse, parse_qs, unquote

from bs4 import BeautifulSoup

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

# Bilibili 搜索配置
BILI_QUERIES = ["AI 人工智能", "编程 开发"]
BILI_PER_QUERY = 5

# 微博热搜配置
WEIBO_TECH_KEYWORDS = ["AI", "人工智能", "ChatGPT", "编程", "技术", "互联网", "苹果", "手机", "芯片", "科技"]

# DuckDuckGo 搜索配置
DDG_QUERIES = ["AI news today", "programming tech news"]
DDG_PER_QUERY = 5

# RSS 信息源配置
RSS_SOURCES = [
    {
        "name": "arXiv AI 研究",
        "url": "https://export.arxiv.org/rss/cs.AI",
        "limit": 5,
        "translate": True,
        "section_group": "ai_research",
        "source_type": "arxiv",
    },
    {
        "name": "arXiv 分布式系统",
        "url": "https://export.arxiv.org/rss/cs.DC",
        "limit": 5,
        "translate": True,
        "section_group": "ai_research",
        "source_type": "arxiv",
    },
    {
        "name": "Dev.to",
        "url": "https://dev.to/feed",
        "limit": 5,
        "translate": True,
        "section_group": "dev_community",
    },
    {
        "name": "Lobste.rs",
        "url": "https://lobste.rs/rss",
        "limit": 5,
        "translate": True,
        "section_group": "dev_community",
    },
    {
        "name": "MIT Technology Review",
        "url": "https://www.technologyreview.com/feed/",
        "limit": 5,
        "translate": True,
        "section_group": "tech_news",
    },
    {
        "name": "Ars Technica",
        "url": "https://feeds.arstechnica.com/arstechnica/technology-lab",
        "limit": 5,
        "translate": True,
        "section_group": "tech_news",
    },
    {
        "name": "Reddit r/MachineLearning",
        "url": "https://www.reddit.com/r/MachineLearning/.rss",
        "limit": 5,
        "translate": True,
        "section_group": "reddit",
    },
    {
        "name": "Reddit r/programming",
        "url": "https://www.reddit.com/r/programming/.rss",
        "limit": 5,
        "translate": True,
        "section_group": "reddit",
    },
]

# section_group 到 MD 标题的映射
RSS_GROUP_TITLES = {
    "ai_research": "AI 研究动态（arXiv）",
    "dev_community": "开发者社区（Dev.to & Lobste.rs）",
    "tech_news": "科技深度（MIT TR & Ars Technica）",
    "reddit": "社区热议（Reddit）",
}


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


def fetch_github_trending_deno(n: int = 8) -> list[dict]:
    """降级方案：使用第三方 deno 代理抓取 GitHub Trending"""
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
        print(f"[WARN] GitHub Trending deno proxy failed: {e}")
        return []


def _bili_headers():
    """生成 Bilibili 请求头"""
    buvid3 = f"{uuid.uuid4()}infoc"
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://search.bilibili.com/",
        "Accept": "application/json",
        "Cookie": f"buvid3={buvid3}",
    }


def fetch_bilibili(query: str, n: int = 5) -> list[dict]:
    """搜索 B站 最新技术视频（官方公开 API，无需 key）"""
    try:
        resp = requests.get(
            "https://api.bilibili.com/x/web-interface/search/type",
            params={"keyword": query, "search_type": "video", "order": "pubdate", "page": 1, "pagesize": n},
            headers=_bili_headers(), timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != 0:
            return []
        results = []
        for v in data.get("data", {}).get("result", []):
            title = re.sub(r"</?em[^>]*>", "", v.get("title", ""))
            results.append({
                "title": title,
                "url": f"https://www.bilibili.com/video/{v['bvid']}",
                "author": v.get("author", ""),
                "view_count": v.get("play", 0),
            })
        return results[:n]
    except Exception as e:
        print(f"[WARN] Bilibili fetch failed for '{query}': {e}")
        return []


def fetch_weibo_hot(keywords: list[str] = None) -> list[dict]:
    """抓取微博热搜，过滤出科技相关话题（公开 API，无需 key）"""
    if keywords is None:
        keywords = WEIBO_TECH_KEYWORDS
    try:
        resp = requests.get(
            "https://weibo.com/ajax/side/hotSearch",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://weibo.com/",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("ok") != 1:
            return []
        results = []
        for item in data.get("data", {}).get("realtime", []):
            word = item.get("note") or item.get("word", "")
            if any(kw.lower() in word.lower() for kw in keywords):
                results.append({
                    "title": word,
                    "url": f"https://s.weibo.com/weibo?q={quote('#' + word + '#')}",
                    "heat": item.get("num", 0),
                })
        return results[:5]
    except Exception as e:
        print(f"[WARN] Weibo hot search failed: {e}")
        return []


def fetch_duckduckgo(query: str, n: int = 5) -> list[dict]:
    """DuckDuckGo HTML 版搜索，无 API key，反爬最宽松"""
    try:
        resp = requests.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.5",
            },
            timeout=15,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []
        for item in soup.select(".result"):
            title_el = item.select_one(".result__title a")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            raw_url = title_el.get("href", "")
            url = raw_url
            if "uddg=" in raw_url:
                try:
                    full = raw_url if raw_url.startswith("http") else "https:" + raw_url
                    params = parse_qs(urlparse(full).query)
                    extracted = unquote(params.get("uddg", [""])[0])
                    if extracted and "duckduckgo.com/y.js" not in extracted:
                        url = extracted
                    else:
                        continue
                except Exception:
                    pass
            snippet_el = item.select_one(".result__snippet")
            snippet = snippet_el.get_text(strip=True) if snippet_el else ""
            if title and url and url.startswith("http"):
                results.append({"title": title, "url": url, "content": snippet})
                if len(results) >= n:
                    break
        return results
    except Exception as e:
        print(f"[WARN] DuckDuckGo fetch failed for '{query}': {e}")
        return []


def fetch_github_trending(n: int = 8) -> list[dict]:
    """使用 GitHub Search API 获取最近一周创建的优质仓库"""
    one_week_ago = (datetime.datetime.utcnow() - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    url = "https://api.github.com/search/repositories"
    params = {
        "q": f"created:>{one_week_ago}",
        "sort": "stars",
        "order": "desc",
        "per_page": n,
    }
    try:
        resp = requests.get(url, params=params, timeout=15, headers={
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DailyTechBot/1.0",
        })
        resp.raise_for_status()
        items = resp.json().get("items", [])
        return [
            {
                "name": item.get("full_name", ""),
                "author": item.get("owner", {}).get("login", ""),
                "url": item.get("html_url", ""),
                "description": item.get("description", ""),
                "stars": item.get("stargazers_count", 0),
                "language": item.get("language", ""),
            }
            for item in items
        ]
    except Exception as e:
        print(f"[WARN] GitHub Search API failed: {e}, falling back to deno proxy")
        return fetch_github_trending_deno(n)


def fetch_rss(url: str, n: int = 5, timeout: int = 15, source_type: str = "") -> list[dict]:
    """通用 RSS 抓取函数，返回统一格式条目列表"""
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DailyTechBot/1.0; +https://github.com/txc1224/txc1224.github.io)"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
        items = []
        for entry in feed.entries[:n]:
            title = entry.get("title", "").strip()
            link = entry.get("link", "").strip()
            if not title or not link:
                continue

            # arXiv 标题清洗：去除 [Title](url) 格式和 [cs.AI] 标签
            if source_type == "arxiv":
                title = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', title)
                title = re.sub(r'\s*\[[^\]]*\]\s*', ' ', title).strip()

            # 提取摘要，优先 summary，其次 content
            raw_summary = entry.get("summary", "") or ""
            if not raw_summary and entry.get("content"):
                raw_summary = entry["content"][0].get("value", "")

            # 去除 HTML 标签
            clean_summary = re.sub(r"<[^>]+>", "", raw_summary).strip()

            # arXiv 摘要清洗：去除 "Abstract:" 前缀，只取前 200 字
            if source_type == "arxiv":
                clean_summary = re.sub(r'^Abstract:\s*', '', clean_summary, flags=re.IGNORECASE)
                clean_summary = clean_summary[:200]
            elif len(clean_summary) > 200:
                clean_summary = clean_summary[:200] + "..."

            items.append({"title": title, "url": link, "summary": clean_summary, "source_type": source_type})
        return items
    except Exception as e:
        print(f"[WARN] RSS fetch failed for {url}: {e}")
        return []


def rule_extract_summary(title: str) -> str:
    """无 API Key 时的降级策略：从标题中提取关键信息作为摘要"""
    patterns = [
        r'(?:announces?|releases?|launches?|introduces?|presents?)\s+([^.,;:]+)',
        r'(?:宣布|发布|推出|实现|提出)\s*([^。，,;；]+)',
        r'\b(v\d+\.\d+(?:\.\d+)?)\b',
    ]
    for p in patterns:
        m = re.search(p, title, re.IGNORECASE)
        if m:
            return m.group(1).strip()[:25]
    return "-"


def groq_translate_batch(texts: list[str], modes: list[str] = None, batch_size: int = 5) -> list[str]:
    """
    批量翻译，支持 arXiv/默认两档 prompt
    modes: 与 texts 等长，每个元素为 "default" 或 "arxiv"
    batch_size: 每次最多请求 5 条（平衡 token 消耗和延迟）
    """
    if not GROQ_API_KEY:
        print("[WARN] GROQ_API_KEY 未设置，使用降级策略")
        return [f"{t} | {rule_extract_summary(t)}" for t in texts]

    if not texts:
        return []

    if modes is None:
        modes = ["default"] * len(texts)

    results = [None] * len(texts)

    # 按 batch_size 分批处理
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_modes = modes[i:i + batch_size]
        batch_idx = list(range(i, min(i + batch_size, len(texts))))

        # 区分 arXiv 和默认模式
        has_arxiv = any(m == "arxiv" for m in batch_modes)

        if has_arxiv:
            # arXiv 专用 prompt
            prompt_lines = []
            for idx, text in enumerate(batch_texts):
                prompt_lines.append(f"[{idx+1}] {text}")
            prompt = (
                f"以下为 {len(batch_texts)} 篇学术论文的英文标题和摘要摘录，请分别为每篇：\n"
                f"1. 将标题翻译为中文（不超过25字）\n"
                f"2. 用一句话概括研究贡献（20字以内，中文）\n"
                f"按以下格式返回：\n"
                f"[1] 中文标题 | 研究贡献\n"
                f"[2] 中文标题 | 研究贡献\n"
                f"...\n\n" + "\n".join(prompt_lines)
            )
        else:
            # 默认 prompt
            prompt_lines = []
            for idx, text in enumerate(batch_texts):
                prompt_lines.append(f"[{idx+1}] {text}")
            prompt = (
                f"请为以下 {len(batch_texts)} 条英文技术文章标题分别生成中文翻译和一句话摘要（20字以内）。\n"
                f"按以下格式返回：\n"
                f"[1] 中文标题 | 摘要\n"
                f"[2] 中文标题 | 摘要\n"
                f"...\n\n" + "\n".join(prompt_lines)
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
                    "max_tokens": 150 * len(batch_texts),
                    "temperature": 0.3,
                },
                timeout=30,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()

            # 解析返回结果
            lines = content.split("\n")
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                match = re.match(r'\[(\d+)\]\s*(.+)', line)
                if match:
                    idx = int(match.group(1)) - 1
                    if 0 <= idx < len(batch_texts):
                        results[batch_idx[idx]] = match.group(2).strip()

        except Exception as e:
            print(f"[WARN] Groq batch translate failed: {e}")
            for j, idx in enumerate(batch_idx):
                if results[idx] is None:
                    results[idx] = f"{batch_texts[j]} | {rule_extract_summary(batch_texts[j])}"

    # 填充未成功翻译的条目
    for i, r in enumerate(results):
        if r is None:
            results[i] = f"{texts[i]} | {rule_extract_summary(texts[i])}"

    return results


def groq_translate(texts: list[str]) -> list[str]:
    """批量翻译标题并生成一句话摘要（兼容旧接口，调用 batch 版本）"""
    return groq_translate_batch(texts, modes=["default"] * len(texts))


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


def generate_daily_md(
    date_str: str,
    hn_sections: dict,
    trending: list,
    rss_groups: dict,
    bili_items: list = None,
    weibo_items: list = None,
    ddg_items: list = None,
) -> str:
    """生成每日资讯 MD 文件内容"""
    bili_items = bili_items or []
    weibo_items = weibo_items or []
    ddg_items = ddg_items or []

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

    # 按 group 顺序输出 RSS 区块
    for group_key, group_title in RSS_GROUP_TITLES.items():
        group_items = rss_groups.get(group_key, [])
        if not group_items:
            continue
        lines.append(f"## {group_title}")
        lines.append("")
        lines.append("| 文章 | 来源 | 摘要 |")
        lines.append("|------|------|------|")
        for item in group_items:
            title_zh = item.get("title_zh", item["title"])
            summary_zh = item.get("summary_zh", item.get("summary", "-") or "-")
            # 截断摘要避免表格撑开（限制25字）
            if len(summary_zh) > 25:
                summary_zh = summary_zh[:25] + "…"
            url = item["url"]
            source = item.get("source_name", "")
            lines.append(f"| [{title_zh}]({url}) | {source} | {summary_zh} |")
        lines.append("")

    # 中文技术热点：B站 & 微博
    if bili_items or weibo_items:
        lines.append("## 中文技术热点（B站 & 微博）")
        lines.append("")
        lines.append("| 内容 | 来源 | 数据 |")
        lines.append("|------|------|------|")
        # B站视频
        for item in bili_items[:5]:
            title = item.get("title", "")
            author = item.get("author", "")
            view_count = item.get("view_count", 0)
            view_str = f"{view_count} 播放" if isinstance(view_count, int) else view_count
            url = item.get("url", "")
            lines.append(f"| [{title}]({url}) | B站: {author} | {view_str} |")
        # 微博热搜
        for item in weibo_items[:5]:
            title = item.get("title", "")
            heat = item.get("heat", 0)
            heat_str = f"{heat} 热度" if isinstance(heat, int) else heat
            url = item.get("url", "")
            lines.append(f"| [{title}]({url}) | 微博热搜 | {heat_str} |")
        lines.append("")

    # Web 搜索补充
    if ddg_items:
        lines.append("## Web 搜索补充（DuckDuckGo）")
        lines.append("")
        lines.append("| 文章 | 摘要 |")
        lines.append("|------|------|")
        for item in ddg_items[:8]:
            title = item.get("title", "")
            url = item.get("url", "")
            content = item.get("content", "")[:40] + "…" if len(item.get("content", "")) > 40 else item.get("content", "")
            lines.append(f"| [{title}]({url}) | {content} |")
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

    # 抓取所有 RSS 源，并按 group 分组
    rss_groups: dict[str, list] = {}
    for source in RSS_SOURCES:
        name = source["name"]
        url = source["url"]
        limit = source["limit"]
        group = source["section_group"]
        source_type = source.get("source_type", "")
        print(f"[INFO] 抓取 RSS [{name}]...")
        items = fetch_rss(url, limit, source_type=source_type)
        for item in items:
            item["source_name"] = name
        if group not in rss_groups:
            rss_groups[group] = []
        rss_groups[group].extend(items)

    # 批量翻译所有 RSS 条目标题（区分 arXiv 模式）
    all_rss_titles = []
    rss_item_refs = []  # 指向原始 item 的引用列表
    rss_modes = []  # 对应每个条目的翻译模式
    for group_items in rss_groups.values():
        for item in group_items:
            all_rss_titles.append(item["title"])
            rss_item_refs.append(item)
            rss_modes.append(item.get("source_type", "") if item.get("source_type") == "arxiv" else "default")

    if all_rss_titles:
        print(f"[INFO] 翻译 {len(all_rss_titles)} 条 RSS 标题...")
        translated_rss = groq_translate_batch(all_rss_titles, modes=rss_modes)
        for item, translated in zip(rss_item_refs, translated_rss):
            parts = translated.split("|", 1)
            item["title_zh"] = parts[0].strip() if parts else item["title"]
            if len(parts) > 1 and parts[1].strip():
                raw = parts[1].strip()
                item["summary_zh"] = raw[:25] + "…" if len(raw) > 25 else raw
            else:
                item["summary_zh"] = "-"  # 不再 fallback 到原始英文 summary

    # ── 中文热点：B站 ──
    print("[INFO] 抓取 Bilibili...")
    bili_items = []
    for q in BILI_QUERIES:
        bili_items.extend(fetch_bilibili(q, BILI_PER_QUERY))
        time.sleep(2)

    # ── 中文热点：微博热搜 ──
    print("[INFO] 抓取微博热搜...")
    weibo_items = fetch_weibo_hot()

    # ── DuckDuckGo 补充热点 ──
    print("[INFO] DuckDuckGo 补充搜索...")
    ddg_items = []
    for q in DDG_QUERIES:
        ddg_items.extend(fetch_duckduckgo(q, DDG_PER_QUERY))
        time.sleep(3)

    # 生成 MD 文件
    os.makedirs(DOCS_DIR, exist_ok=True)
    md_content = generate_daily_md(date_str, hn_sections, trending, rss_groups, bili_items, weibo_items, ddg_items)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[INFO] 已生成 {filepath}")

    # 更新 index.md
    update_index(date_str, filename)
    print(f"[INFO] 已更新 {INDEX_FILE}")
    print("[INFO] 完成！")


if __name__ == "__main__":
    main()
