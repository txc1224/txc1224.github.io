<template>
  <DefaultLayout>
    <template #layout-top>
      <SakuraCanvas />
    </template>

    <template #layout-bottom>
      <MusicPlayer />
    </template>

    <template #doc-after>
      <RelatedNotes />
      <GiscusComment />
    </template>
  </DefaultLayout>

  <div
    class="theme-burst"
    :class="{
      'is-active': burst.active,
      'is-dark-target': burst.toDark,
    }"
    :style="burstStyle"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watchEffect } from 'vue';
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import SakuraCanvas from './components/SakuraCanvas.vue';
import GiscusComment from './components/GiscusComment.vue';
import RelatedNotes from './components/RelatedNotes.vue';
import MusicPlayer from './components/MusicPlayer.vue';

const DefaultLayout = DefaultTheme.Layout;
const { frontmatter, isDark } = useData();
const burst = ref({
  active: false,
  x: 0,
  y: 0,
  size: 0,
  toDark: false,
});

const burstStyle = computed(() => ({
  '--txc-burst-x': `${burst.value.x}px`,
  '--txc-burst-y': `${burst.value.y}px`,
  '--txc-burst-size': `${burst.value.size}px`,
}));

let burstTimer: ReturnType<typeof window.setTimeout> | undefined;

function syncHomeNavState() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const isHome = frontmatter.value.layout === 'home';
  const root = document.documentElement;

  if (!isHome) {
    root.classList.remove('txc-home-nav-float', 'txc-home-nav-compact');
    return;
  }

  const floatThreshold = Math.min(window.innerHeight * 0.58, 460);
  const scrollY = window.scrollY;
  root.classList.toggle('txc-home-nav-float', scrollY < floatThreshold);
  root.classList.toggle('txc-home-nav-compact', scrollY > 28 && scrollY < floatThreshold);
}

function canAnimateAppearance() {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function triggerBurst(x: number, y: number, size: number, toDark: boolean) {
  if (burstTimer) {
    window.clearTimeout(burstTimer);
  }

  burst.value = {
    active: false,
    x,
    y,
    size,
    toDark,
  };

  requestAnimationFrame(() => {
    burst.value = {
      active: true,
      x,
      y,
      size,
      toDark,
    };
  });

  burstTimer = window.setTimeout(() => {
    burst.value.active = false;
  }, 720);
}

provide('toggle-appearance', async (event?: MouseEvent) => {
  const nextDark = !isDark.value;
  const switchAppearance = async () => {
    isDark.value = nextDark;
    await nextTick();
  };

  if (!canAnimateAppearance()) {
    await switchAppearance();
    return;
  }

  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];
  triggerBurst(x, y, radius * 2, nextDark);
  const transition = document.startViewTransition(switchAppearance);

  await transition.ready;

  document.documentElement.animate(
    {
      clipPath: isDark.value ? clipPath : [...clipPath].reverse(),
      filter: isDark.value
        ? ['brightness(1.18) saturate(1.08)', 'brightness(1) saturate(1)']
        : ['brightness(0.92) saturate(1.14)', 'brightness(1) saturate(1)'],
    },
    {
      duration: 640,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      pseudoElement: `::view-transition-${isDark.value ? 'new' : 'old'}(root)`,
    },
  );
});

onMounted(() => {
  syncHomeNavState();
  window.addEventListener('scroll', syncHomeNavState, { passive: true });
  window.addEventListener('resize', syncHomeNavState, { passive: true });
});

watchEffect(() => {
  syncHomeNavState();
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', syncHomeNavState);
    window.removeEventListener('resize', syncHomeNavState);
  }

  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('txc-home-nav-float', 'txc-home-nav-compact');
  }
});
</script>
