<template>
  <section
    class="music-float"
    :class="{
      'is-open': isOpen,
      'is-playing': isPlaying,
      'is-compact': isCompact && !isOpen,
      'is-docked': isDocked && !isOpen,
    }"
  >
    <button class="music-float__dock" type="button" :aria-expanded="isOpen" @click="toggleOpen">
      <img src="/kuromi-cover.png" alt="Kuromi artwork" />
      <div>
        <strong>
          Lo-fi Corner
          <span v-if="isPlaying" class="music-eq music-eq--inline" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </strong>
        <span>{{ isPlaying ? 'Playing now' : 'Tap to open' }}</span>
      </div>
    </button>

    <div v-if="isOpen" class="music-player" :class="{ 'is-playing': isPlaying }">
      <div class="music-player__art">
        <img src="/kuromi-cover.png" alt="Kuromi artwork" />
      </div>

      <div class="music-player__body">
        <p class="music-player__eyebrow">
          Lo-fi Corner
          <span v-if="isPlaying" class="music-eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
        <strong>{{ currentTrack.title }}</strong>
        <span>{{ currentTrack.artist }}</span>

        <div class="music-player__progress" role="presentation">
          <div class="music-player__progress-bar" :style="{ width: `${progress}%` }" />
        </div>

        <div class="music-player__meta">
          <small>{{ formatTime(currentTime) }}</small>
          <small>{{ formatTime(duration) }}</small>
        </div>
      </div>

      <div class="music-player__controls">
        <button type="button" aria-label="Previous track" @click="playPrev">‹</button>
        <button
          type="button"
          class="music-player__toggle"
          :aria-label="isPlaying ? 'Pause music' : 'Play music'"
          @click="togglePlay"
        >
          {{ isPlaying ? 'Pause' : 'Play' }}
        </button>
        <button type="button" aria-label="Next track" @click="playNext">›</button>
      </div>
    </div>

    <audio
      ref="audioRef"
      preload="none"
      :src="currentTrack.src"
      @timeupdate="syncProgress"
      @loadedmetadata="syncProgress"
      @ended="playNext"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { musicManifest } from '../data/music-manifest';

const STORAGE_KEY = 'txc-music-player-state';
const tracks = musicManifest;

const audioRef = ref<HTMLAudioElement | null>(null);
const currentIndex = ref(0);
const isPlaying = ref(false);
const isOpen = ref(false);
const isCompact = ref(false);
const isDocked = ref(false);
const currentTime = ref(0);
const duration = ref(0);

const currentTrack = computed(() => tracks[currentIndex.value] ?? tracks[0]);
const progress = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0));

function toggleOpen() {
  isOpen.value = !isOpen.value;
  persistState();
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function persistState() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentIndex: currentIndex.value,
      isPlaying: isPlaying.value,
      isOpen: isOpen.value,
    }),
  );
}

async function playCurrent() {
  const audio = audioRef.value;
  if (!audio) return;
  try {
    await audio.play();
    isPlaying.value = true;
    persistState();
  } catch {
    isPlaying.value = false;
  }
}

function pauseCurrent() {
  audioRef.value?.pause();
  isPlaying.value = false;
  persistState();
}

function togglePlay() {
  if (isPlaying.value) {
    pauseCurrent();
    return;
  }
  playCurrent();
}

function playNext() {
  currentIndex.value = (currentIndex.value + 1) % tracks.length;
}

function playPrev() {
  currentIndex.value = (currentIndex.value - 1 + tracks.length) % tracks.length;
}

function syncProgress() {
  const audio = audioRef.value;
  if (!audio) return;
  currentTime.value = audio.currentTime || 0;
  duration.value = audio.duration || 0;
}

function syncViewportMode() {
  if (typeof window === 'undefined') return;
  isCompact.value = window.innerWidth <= 640;
}

function syncScrollState() {
  if (typeof window === 'undefined') return;
  isDocked.value = window.scrollY > 180;
}

watch(currentIndex, async () => {
  currentTime.value = 0;
  duration.value = 0;
  persistState();
  if (isPlaying.value) {
    await playCurrent();
  } else {
    audioRef.value?.load();
  }
});

onMounted(() => {
  if (typeof window === 'undefined') return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw) as { currentIndex?: number; isPlaying?: boolean; isOpen?: boolean };
    if (typeof state.currentIndex === 'number' && state.currentIndex >= 0 && state.currentIndex < tracks.length) {
      currentIndex.value = state.currentIndex;
    }
    if (typeof state.isOpen === 'boolean') {
      isOpen.value = state.isOpen;
    }
    if (state.isPlaying) {
      playCurrent();
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  syncViewportMode();
  syncScrollState();
  window.addEventListener('resize', syncViewportMode, { passive: true });
  window.addEventListener('scroll', syncScrollState, { passive: true });
});

onBeforeUnmount(() => {
  pauseCurrent();
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', syncViewportMode);
    window.removeEventListener('scroll', syncScrollState);
  }
});
</script>
