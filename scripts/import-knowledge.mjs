#!/usr/bin/env node

/**
 * 知识库导入脚本:读取 Desktop 知识库,按主题合并到 VitePress 栏目。
 * 用法: node scripts/import-knowledge.mjs [--dry-run]
 * --dry-run 仅打印映射表与统计,不实写文件。
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = join(__dirname, '..', 'docs');
const KB_ROOT = join(process.env.HOME, 'Desktop', 'markdowns', '知识库');
const DRY = process.argv.includes('--dry-run');

/** 解析 frontmatter 为 { key: value } */
function parseFM(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      try {
        v = JSON.parse(v.replace(/'/g, '"'));
      } catch {
        v = [v];
      }
    }
    out[k] = v;
  }
  return out;
}

/** 读取所有知识点文件,返回 [{ path, content, fm, kb }] */
function readKB(kbDir) {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_')) continue;
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
      const name = entry.name.replace(/\.md$/, '');
      // 跳过纯管理文件
      if (['INDEX', 'README', 'REVIEW', 'ROADMAP'].includes(name)) continue;
      files.push({ path: p, name, kbDir });
    }
  }
  walk(kbDir);
  return files;
}

/** 知识点目录 → VitePress 目标文件(相对于 DOCS_ROOT)的映射表 */
const MAPPING = {
  // ─── 前端知识库 ──────
  '前端知识库/01-js-core/01-types': 'js/types.md',
  '前端知识库/01-js-core/02-prototype': 'js/core.md',
  '前端知识库/01-js-core/03-scope-closure': 'js/core.md',
  '前端知识库/01-js-core/04-async': 'js/async.md',
  '前端知识库/01-js-core/05-event-loop': 'js/advanced.md',
  '前端知识库/02-browser/01-rendering': 'js/advanced.md',
  '前端知识库/02-browser/02-security': 'js/advanced.md',
  '前端知识库/02-browser/03-cache': 'js/advanced.md',
  '前端知识库/02-browser/04-cors': 'js/advanced.md',
  '前端知识库/03-engineering/01-modules': 'js/es6.md',
  '前端知识库/03-engineering/02-bundlers': 'js/es6.md',
  '前端知识库/03-engineering/03-ast-babel': 'js/es6.md',
  '前端知识库/03-engineering/04-lint': 'js/es6.md',
  '前端知识库/03-engineering/05-perf': 'js/es6.md',
  '前端知识库/04-frameworks/01-vue': 'vue/reactivity.md',
  '前端知识库/04-frameworks/02-react': 'react/hooks.md',
  '前端知识库/04-frameworks/03-miniprogram': 'js/advanced.md',

  // ─── Java 知识库 ──────
  'Java知识库/01-basics': 'java/types.md',
  'Java知识库/02-jvm': 'java/types.md',
  'Java知识库/03-collections': 'java/collections.md',
  'Java知识库/04-concurrency': 'java/threading.md',
  'Java知识库/05-io-nio': 'java/types.md',
  'Java知识库/06-jdbc-orm': 'java/types.md',
  'Java知识库/07-spring': 'java/oop.md',
  'Java知识库/08-web-server': 'java/collections.md',
  'Java知识库/09-middleware': 'java/oop.md',
  'Java知识库/10-microservice': 'java/oop.md',

  // ─── Python 知识库 ──────
  'Python知识库/01-basics': 'python/types.md',
  'Python知识库/02-stdlib': 'python/stdlib.md',
  'Python知识库/03-oop-advanced': 'python/oop.md',
  'Python知识库/04-async-typing': 'python/typing.md',
  'Python知识库/05-engineering': 'python/functions.md',
  'Python知识库/06-web-frameworks': 'python/functions.md',
  'Python知识库/07-data-stack': 'python/stdlib.md',
  'Python知识库/08-ai-stack': 'python/functions.md',
};

const MARKER_START = '<!-- KNOWLEDGE-IMPORT:START -->';
const MARKER_END = '<!-- KNOWLEDGE-IMPORT:END -->';

/** 读取或初始化目标文件 */
function readTarget(relPath) {
  const full = join(DOCS_ROOT, relPath);
  if (existsSync(full)) return readFileSync(full, 'utf-8');
  // 新建文件:读该目录 index.md 拿 frontmatter 模板
  const idx = join(dirname(full), 'index.md');
  if (existsSync(idx)) {
    const idxSrc = readFileSync(idx, 'utf-8');
    const idxFM = parseFM(idxSrc);
    const title = idxFM.title || basenameNoExt(relPath);
    return `---\ntitle: '${title}'\norder: 99\n---\n\n# ${title}\n\n`;
  }
  return '';
}

function basenameNoExt(p) {
  return p.split('/').pop().replace(/\.md$/, '');
}

/** 从知识点文件提取正文(去 frontmatter 后的 ## 节) */
function extractBody(src) {
  const m = src.match(/^---\n[\s\S]*?\n---\n?/);
  if (!m) return src;
  let body = src.slice(m[0].length).trim();
  // 去掉开头的 # 一级标题(目标文件已有自己的标题)
  body = body.replace(/^# .+\n\n?/, '');
  return body;
}

/** 主流程 */
function main() {
  const kbFiles = [
    ...readKB(join(KB_ROOT, '前端知识库')),
    ...readKB(join(KB_ROOT, 'Java知识库')),
    ...readKB(join(KB_ROOT, 'Python知识库')),
  ];

  // 按目标文件分组
  const groups = new Map(); // relPath -> [{ kbDir, name, content }]
  for (const { path, name, kbDir } of kbFiles) {
    // 从 path 找到所属的映射键(最长的前缀匹配)
    let mappedTo = null;
    for (const [kbPrefix, target] of Object.entries(MAPPING)) {
      if (path.startsWith(join(KB_ROOT, kbPrefix))) {
        if (!mappedTo || kbPrefix.length > mappedTo.prefixLen) {
          mappedTo = { target, prefixLen: kbPrefix.length };
        }
      }
    }
    if (!mappedTo) continue;
    const src = readFileSync(path, 'utf-8');
    const fm = parseFM(src);
    const body = extractBody(src);
    if (!groups.has(mappedTo.target)) groups.set(mappedTo.target, []);
    groups.get(mappedTo.target).push({ kbRel: kbDir + '/' + name, title: fm.title || name, body });
  }

  if (DRY) {
    console.log(`[DRY-RUN] ${kbFiles.length} 个知识点 → ${groups.size} 个目标文件\n`);
    for (const [target, items] of [...groups.entries()].sort()) {
      console.log(`  ${target} (${items.length} 个知识点)`);
      for (const item of items) console.log(`    - ${item.title}`);
    }
    process.exit(0);
  }

  // 实写
  console.log(`写入 ${groups.size} 个目标文件...`);
  let written = 0;
  for (const [target, items] of groups.entries()) {
    const existing = readTarget(target);
    const sections = items
      .map((item) => {
        // 预处理 body: 转义 Vue 会误读的裸尖括号(非标准 HTML 标签)
        let cleanBody = item.body;
        cleanBody = cleanBody.replace(/<(\/?!?[a-zA-Z][\w.-]*)>/g, (match) => {
          // 保持已知 HTML 标签和 HTML 注释不变
          const inner = match.replace(/^<|>$/g, '').replace(/^\//, '');
          if (inner.startsWith('!')) return match;
          return `&lt;${inner}&gt;`;
        });
        return `## ${item.title}\n\n${cleanBody}`;
      })
      .join('\n\n---\n\n');

    // 更新/追加:已有 IMPORT 标记则替换标记内内容,否则追加
    let out;
    if (existing.includes(MARKER_START) && existing.includes(MARKER_END)) {
      out = existing.replace(
        new RegExp(`${MARKER_START}[\\s\\S]*${MARKER_END}`, 'm'),
        `${MARKER_START}\n${sections}\n${MARKER_END}`,
      );
    } else {
      out = existing.trimEnd() + `\n\n${MARKER_START}\n${sections}\n${MARKER_END}\n`;
    }

    const full = join(DOCS_ROOT, target);
    writeFileSync(full, out);
    written++;
  }
  console.log(`完成 ${written} 个目标文件, ${kbFiles.length} 个知识点`);

  // 补 index.md 目录列表(新文件检测)
  const indices = new Set();
  for (const [target] of groups) {
    const idx = join(DOCS_ROOT, dirname(target), 'index.md');
    if (existsSync(idx)) indices.add(idx);
  }
  for (const idx of indices) {
    let src = readFileSync(idx, 'utf-8');
    // 不自动改 index,只提示
    // 实际可以用 sed 追 link,但手动更安全
  }
  console.log(`  ⌨ 可能需要手动更新 ${indices.size} 个 index.md 的目录列表`);
}

main();
