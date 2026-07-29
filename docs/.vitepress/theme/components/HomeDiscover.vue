<template>
  <section ref="discoverRef" class="home-discover home-motion" :class="{ 'is-visible': isVisible }">
    <div class="discover-stack">
      <article class="discover-panel discover-panel--map">
        <div class="panel-heading">
          <p class="panel-kicker">Knowledge Map</p>
          <h2>从内容地图里选一条顺手的路径</h2>
          <p>不再把所有栏目平铺成一堆一样的卡片。这里优先展示学习路径清晰、能持续回访的核心区域。</p>
        </div>

        <div class="section-grid">
          <a v-for="section in noteSections" :key="section.slug" class="section-card" :href="section.href">
            <span class="section-accent">{{ section.accent }}</span>
            <strong>{{ section.title }}</strong>
            <span>{{ section.description }}</span>
            <em>{{ section.articleCount }} 篇笔记</em>
          </a>
        </div>
      </article>

      <article class="discover-panel discover-panel--feed">
        <div class="panel-heading">
          <p class="panel-kicker">Fresh Feed</p>
          <h2>最近日更</h2>
          <p>最近几期先扫一眼主题，再决定要不要点进去细读。</p>
        </div>

        <ol class="daily-list">
          <li v-for="item in homeData.latestDaily" :key="item.href">
            <a :href="item.href">
              <strong>{{ item.title }}</strong>
              <span>{{ item.description }}</span>
            </a>
          </li>
        </ol>
      </article>

      <article class="discover-panel discover-panel--featured">
        <div class="panel-heading">
          <p class="panel-kicker">Featured Notes</p>
          <h2>精选速查</h2>
          <p>适合先看一篇快速热身，再顺着相关推荐继续读。</p>
        </div>

        <div class="featured-list">
          <a v-for="item in homeData.featuredNotes" :key="item.href" class="featured-item" :href="item.href">
            <strong>{{ item.title }}</strong>
            <span>{{ item.description }}</span>
          </a>
        </div>
      </article>

      <article class="discover-panel discover-panel--more">
        <div class="panel-heading">
          <p class="panel-kicker">More Than Notes</p>
          <h2>站内其他入口</h2>
          <p>把工具属性和内容属性拆开，避免首页所有入口长得一个样。</p>
        </div>

        <div class="feature-list">
          <a v-for="section in featureSections" :key="section.slug" class="feature-item" :href="section.href">
            <div>
              <span class="section-accent">{{ section.accent }}</span>
              <strong>{{ section.title }}</strong>
            </div>
            <p>{{ section.description }}</p>
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { homeData } from '../data/site-content';

const noteSections = computed(() => homeData.sections.filter((section) => section.kind === 'notes'));
const featureSections = computed(() => homeData.sections.filter((section) => section.kind === 'feature'));
const discoverRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
let observer: IntersectionObserver | undefined;
let rafId = 0;

// 滚动时:每张面板独立判断「是否进入视口」,进入即淡入、完全滚出才淡出。
// 交接时新旧两张会短暂同时可见(交叉淡化),不会再出现两张都消失的空白。
function syncActivePanel() {
  rafId = 0;
  if (!discoverRef.value) return;
  const panels = [...discoverRef.value.querySelectorAll<HTMLElement>('.discover-panel')];
  const vh = window.innerHeight;
  for (const el of panels) {
    const r = el.getBoundingClientRect();
    // 进入视口(下缘进入视口下 15% 且上缘未完全滚出视口顶 10%)→ 显示;否则淡出
    const inView = r.bottom > vh * 0.15 && r.top < vh * 0.9;
    el.classList.toggle('panel-in', inView);
  }
}

function onScroll() {
  if (rafId) return;
  rafId = window.requestAnimationFrame(syncActivePanel);
}

onMounted(() => {
  if (!discoverRef.value || typeof window === 'undefined') return;
  observer = new window.IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      isVisible.value = true;
      observer?.disconnect();
    },
    { threshold: 0.12 },
  );
  observer.observe(discoverRef.value);

  syncActivePanel();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (rafId) window.cancelAnimationFrame(rafId);
  }
});
</script>
