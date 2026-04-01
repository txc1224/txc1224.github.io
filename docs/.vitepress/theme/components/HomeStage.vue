<template>
  <section
    ref="stageRef"
    class="home-stage home-motion"
    :class="{ 'is-visible': isVisible, 'is-pinned': pinProgress > 0.02 && pinProgress < 0.98 }"
    :style="{
      '--txc-stage-progress': pinProgress.toFixed(3),
      '--txc-stage-parallax-x': `${parallax.x}px`,
      '--txc-stage-parallax-y': `${parallax.y}px`,
    }"
  >
    <div class="home-stage__pin-wrap">
      <div class="home-stage__hero">
        <div class="home-stage__copy" data-reveal="left">
          <div class="home-stage__ambient home-stage__ambient--top" aria-hidden="true" />
          <div class="home-stage__ambient home-stage__ambient--bottom" aria-hidden="true" />
          <p class="home-stage__eyebrow">txc memo deck</p>
          <h2>把备忘录做成一个更可爱、也更好逛的技术站。</h2>
          <p class="home-stage__summary">
            知识点速查、日更资讯、收藏导航和小游戏都在一个入口里。首页不再只是目录，而是你每天回来都会顺手看一眼的面板。
          </p>

          <div class="home-stage__actions">
            <a href="/daily-tech/">先看今天的日报</a>
            <a href="/archive/" class="is-secondary">按专题刷知识库</a>
          </div>

          <dl class="home-stage__stats">
            <div>
              <dt>知识栏目</dt>
              <dd>{{ noteSections.length }}</dd>
            </div>
            <div>
              <dt>已整理笔记</dt>
              <dd>{{ totalNotes }}</dd>
            </div>
            <div>
              <dt>最新日报</dt>
              <dd>{{ latestIssue }}</dd>
            </div>
          </dl>
        </div>

        <div
          class="home-stage__visual"
          data-reveal="right"
          @pointermove="handlePointerMove"
          @pointerleave="resetParallax"
        >
          <div class="home-stage__float-card home-stage__float-card--left">
            <span>Daily</span>
            <strong>{{ latestIssue }}</strong>
          </div>
          <div class="home-stage__float-card home-stage__float-card--right">
            <span>Stack</span>
            <strong>{{ totalNotes }} notes</strong>
          </div>
          <div class="home-stage__portrait">
            <img src="/kuromi-cover.png" alt="Kuromi artwork" />
          </div>
          <div class="home-stage__note">
            <span>Today</span>
            <strong>{{ latestIssue }}</strong>
            <p>首页现在会把日报、专题和导航入口一起带出来，回访路径更顺。</p>
          </div>
        </div>
      </div>

      <div class="home-stage__scrollcue" aria-hidden="true">
        <span>Scroll-driven deck</span>
        <div class="home-stage__scrollbar">
          <i />
        </div>
        <strong>继续下滑，内容面板会接管首屏</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { archiveGroups, dailyDigestEntries, homeData } from '../data/site-content';

const noteSections = computed(() => homeData.sections.filter((section) => section.kind === 'notes'));
const totalNotes = computed(() => archiveGroups.reduce((sum, group) => sum + group.count, 0));
const latestIssue = computed(() => dailyDigestEntries[0]?.date ?? 'waiting');
const stageRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const pinProgress = ref(0);
const parallax = ref({ x: 0, y: 0 });
let observer: IntersectionObserver | undefined;

function handlePointerMove(event: PointerEvent) {
  const card = event.currentTarget as HTMLElement | null;
  if (!card) return;
  const bounds = card.getBoundingClientRect();
  const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
  const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
  parallax.value = {
    x: Number((offsetX * 12).toFixed(2)),
    y: Number((offsetY * 10).toFixed(2)),
  };
}

function resetParallax() {
  parallax.value = { x: 0, y: 0 };
}

function syncPinProgress() {
  if (!stageRef.value || typeof window === 'undefined') return;
  const rect = stageRef.value.getBoundingClientRect();
  const scrollable = Math.max(stageRef.value.offsetHeight - window.innerHeight, 1);
  const passed = Math.min(Math.max(-rect.top, 0), scrollable);
  pinProgress.value = Number((passed / scrollable).toFixed(3));
}

onMounted(() => {
  if (!stageRef.value || typeof window === 'undefined') return;
  observer = new window.IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      isVisible.value = true;
      observer?.disconnect();
    },
    { threshold: 0.24 },
  );
  observer.observe(stageRef.value);
  syncPinProgress();
  window.addEventListener('scroll', syncPinProgress, { passive: true });
  window.addEventListener('resize', syncPinProgress, { passive: true });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', syncPinProgress);
    window.removeEventListener('resize', syncPinProgress);
  }
});
</script>
