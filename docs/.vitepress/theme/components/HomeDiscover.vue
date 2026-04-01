<template>
  <section ref="discoverRef" class="home-discover home-motion" :class="{ 'is-visible': isVisible }">
    <div class="discover-stack">
      <article class="discover-panel discover-panel--map" data-reveal="up">
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

      <article class="discover-panel discover-panel--feed" data-reveal="up">
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

      <article class="discover-panel discover-panel--featured" data-reveal="up">
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

      <article class="discover-panel discover-panel--more" data-reveal="up">
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
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>
