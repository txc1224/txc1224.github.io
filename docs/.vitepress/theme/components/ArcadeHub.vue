<template>
  <section class="arcade-hub">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Playground</p>
        <h1>Arcade Deck</h1>
        <p class="summary">三个轻量小游戏，三种不同节奏。先选玩法，再刷本地纪录，顺手把今日挑战做掉。</p>
      </div>

      <aside class="challenge" :class="{ 'is-complete': challenge.completed }">
        <p class="challenge-label">今日挑战</p>
        <h3>{{ challenge.game }}</h3>
        <p class="challenge-target">目标分数：{{ challenge.target }}</p>
        <p class="challenge-status">
          {{
            challenge.completed
              ? '已完成，今天这把过线了。'
              : `当前最好成绩 ${challenge.best}，还差 ${challenge.remaining} 分。`
          }}
        </p>
        <div class="streak">
          <span>连胜 {{ streak.current }} 天</span>
          <strong>最长 {{ streak.longest }} 天</strong>
        </div>
      </aside>
    </header>

    <div class="selector">
      <button
        v-for="game in games"
        :key="game.id"
        class="game-card"
        type="button"
        :class="{ 'is-active': selectedGame === game.id }"
        @click="selectedGame = game.id"
      >
        <span class="game-icon">{{ game.icon }}</span>
        <span class="game-name">{{ game.name }}</span>
        <span class="game-meta">{{ game.tagline }}</span>
        <strong class="game-score">Best {{ scoreMap[game.storageKey] ?? 0 }}</strong>
      </button>
    </div>

    <div class="board">
      <div ref="gameFrameRef" class="game-frame">
        <KeepAlive>
          <component :is="activeComponent" />
        </KeepAlive>
      </div>

      <aside class="scoreboard">
        <div class="score-panel">
          <p class="panel-label">本地排行榜</p>
          <ol>
            <li v-for="entry in leaderboard" :key="entry.name">
              <span>{{ entry.name }}</span>
              <strong>{{ entry.score }}</strong>
            </li>
          </ol>
        </div>

        <div class="score-panel">
          <p class="panel-label">玩法速览</p>
          <ul>
            <li v-for="game in games" :key="game.id">
              <strong>{{ game.name }}</strong>
              <span>{{ game.controls }}</span>
            </li>
          </ul>
        </div>

        <div class="score-panel">
          <p class="panel-label">音效</p>
          <button class="audio-toggle" type="button" :class="{ 'is-off': !audioEnabled }" @click="toggleAudio">
            {{ audioEnabled ? '音效已开启' : '音效已静音' }}
          </button>
        </div>

        <div class="score-panel">
          <p class="panel-label">成就徽章</p>
          <ul class="achievement-list">
            <li
              v-for="achievement in achievements"
              :key="achievement.id"
              :class="{ 'is-unlocked': achievement.unlocked }"
            >
              <div>
                <strong>{{ achievement.name }}</strong>
                <span>{{ achievement.description }}</span>
              </div>
              <em>{{ achievement.unlocked ? '已解锁' : '未解锁' }}</em>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <transition name="toast-pop">
      <div v-if="toast" class="toast">
        <strong>{{ toast.title }}</strong>
        <span>{{ toast.body }}</span>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { AUDIO_EVENT, SCORE_EVENT, getArcadeAudioEnabled, setArcadeAudioEnabled } from '../utils/arcade';
import { getLocalDateKey, getPreviousDateKey, normalizeStreakState } from '../utils/arcade-progress.mjs';
import { ARCADE_STORAGE_KEYS, readJsonStorage, readNumberStorage, writeJsonStorage } from '../utils/arcade-storage.mjs';

const MeteorHop = defineAsyncComponent(() => import('./MeteorHop.vue'));
const SignalTap = defineAsyncComponent(() => import('./SignalTap.vue'));
const LaneSprint = defineAsyncComponent(() => import('./LaneSprint.vue'));

interface GameMeta {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  controls: string;
  storageKey: string;
}

const games: GameMeta[] = [
  {
    id: 'meteor-hop',
    name: 'Meteor Hop',
    icon: '☄️',
    tagline: '单键起跳，躲避陨石',
    controls: '空格 / ↑ / 点击',
    storageKey: 'meteor-hop-best-score',
  },
  {
    id: 'signal-tap',
    name: 'Signal Tap',
    icon: '⚡',
    tagline: '盯住高亮，快点快打',
    controls: '鼠标 / 触屏点击',
    storageKey: 'signal-tap-best-score',
  },
  {
    id: 'lane-sprint',
    name: 'Lane Sprint',
    icon: '🛸',
    tagline: '横移变道，避开障碍',
    controls: '← / → / 点击轨道',
    storageKey: 'lane-sprint-best-score',
  },
];

const selectedGame = ref('meteor-hop');
const scoreMap = ref<Record<string, number>>({});
const streak = ref({ current: 0, longest: 0, lastCompletedDate: '' });
const toast = ref<{ title: string; body: string } | null>(null);
const audioEnabled = ref(true);
const gameFrameRef = ref<HTMLElement | null>(null);

let toastTimer = 0;

const STREAK_KEY = ARCADE_STORAGE_KEYS.streak;
const ACHIEVEMENT_KEY = ARCADE_STORAGE_KEYS.achievements;

const gameComponents = {
  'meteor-hop': MeteorHop,
  'signal-tap': SignalTap,
  'lane-sprint': LaneSprint,
} as const;

function refreshScores() {
  if (typeof window === 'undefined') return;

  const nextScores: Record<string, number> = {};
  for (const game of games) {
    nextScores[game.storageKey] = readNumberStorage(game.storageKey, 0);
  }
  scoreMap.value = nextScores;
  syncChallengeProgress(nextScores);
}

function hashDay(input: string) {
  let hash = 0;
  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }
  return hash;
}

const leaderboard = computed(() =>
  [...games]
    .map((game) => ({
      name: game.name,
      score: scoreMap.value[game.storageKey] ?? 0,
    }))
    .sort((a, b) => b.score - a.score),
);

const activeComponent = computed(() => gameComponents[selectedGame.value as keyof typeof gameComponents] ?? MeteorHop);

const challenge = computed(() => {
  const data = getChallengeForDate(getLocalDateKey());
  const best = scoreMap.value[data.storageKey] ?? 0;
  const remaining = Math.max(0, data.target - best);

  return {
    game: data.name,
    target: data.target,
    best,
    remaining,
    completed: best >= data.target,
  };
});

const achievements = computed(() => [
  {
    id: 'first-blood',
    name: '开张了',
    description: '任意游戏本地最高分达到 1 分。',
    unlocked: leaderboard.value.some((entry) => entry.score >= 1),
  },
  {
    id: 'specialist',
    name: '专精玩家',
    description: '任意单个游戏本地最高分达到 12 分。',
    unlocked: leaderboard.value.some((entry) => entry.score >= 12),
  },
  {
    id: 'all-rounder',
    name: '全能选手',
    description: '三个游戏都至少拿到 5 分。',
    unlocked: games.every((game) => (scoreMap.value[game.storageKey] ?? 0) >= 5),
  },
  {
    id: 'daily-discipline',
    name: '连续在线',
    description: '连续 3 天完成今日挑战。',
    unlocked: streak.value.longest >= 3,
  },
  {
    id: 'deck-master',
    name: '牌组大师',
    description: '排行榜第一名达到 20 分。',
    unlocked: leaderboard.value[0]?.score >= 20,
  },
]);

function getChallengeForDate(date: string) {
  const index = hashDay(date) % games.length;
  const selected = games[index];
  const target = 8 + (hashDay(`${date}-${selected.id}`) % 10);

  const best = scoreMap.value[selected.storageKey] ?? 0;

  return {
    game: selected.name,
    name: selected.name,
    target,
    best,
    storageKey: selected.storageKey,
  };
}

function loadStreak() {
  if (typeof window === 'undefined') return;

  try {
    const parsed = readJsonStorage(STREAK_KEY, {}) as {
      current?: number;
      longest?: number;
      lastCompletedDate?: string;
    };

    streak.value = normalizeStreakState(
      {
        current: parsed.current ?? 0,
        longest: parsed.longest ?? 0,
        lastCompletedDate: parsed.lastCompletedDate ?? '',
      },
      getLocalDateKey(),
    );
  } catch {
    streak.value = { current: 0, longest: 0, lastCompletedDate: '' };
  }
}

function persistStreak() {
  if (typeof window === 'undefined') return;
  writeJsonStorage(STREAK_KEY, streak.value);
}

function readAchievementState() {
  if (typeof window === 'undefined') return {} as Record<string, boolean>;

  try {
    return readJsonStorage(ACHIEVEMENT_KEY, {}) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function persistAchievementState(nextState: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  writeJsonStorage(ACHIEVEMENT_KEY, nextState);
}

function showToast(title: string, body: string) {
  toast.value = { title, body };
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = null;
  }, 2600);
}

function syncChallengeProgress(nextScores: Record<string, number>) {
  if (typeof window === 'undefined') return;

  const today = getLocalDateKey();
  const todayChallenge = getChallengeForDate(today);
  const completed = (nextScores[todayChallenge.storageKey] ?? 0) >= todayChallenge.target;

  if (!completed || streak.value.lastCompletedDate === today) return;

  const yesterday = getPreviousDateKey(today);
  const nextCurrent = streak.value.lastCompletedDate === yesterday ? streak.value.current + 1 : 1;
  streak.value = {
    current: nextCurrent,
    longest: Math.max(streak.value.longest, nextCurrent),
    lastCompletedDate: today,
  };
  persistStreak();
  showToast('今日挑战完成', `${todayChallenge.name} 达到 ${todayChallenge.target} 分。`);
}

function syncAchievements() {
  const previous = readAchievementState();
  const nextState = { ...previous };

  for (const achievement of achievements.value) {
    if (achievement.unlocked && !previous[achievement.id]) {
      nextState[achievement.id] = true;
      showToast('成就解锁', `${achievement.name} · ${achievement.description}`);
    }
  }

  persistAchievementState(nextState);
}

function handleScoreUpdate() {
  refreshScores();
  loadStreak();
  syncAchievements();
}

function handleAudioChange() {
  audioEnabled.value = getArcadeAudioEnabled();
}

function handleStorageChange(event: StorageEvent) {
  if (!event.key) {
    handleScoreUpdate();
    handleAudioChange();
    return;
  }

  if (
    event.key === STREAK_KEY ||
    event.key === ACHIEVEMENT_KEY ||
    games.some((game) => game.storageKey === event.key)
  ) {
    handleScoreUpdate();
  }

  if (event.key === ARCADE_STORAGE_KEYS.audioEnabled) {
    handleAudioChange();
  }
}

function toggleAudio() {
  setArcadeAudioEnabled(!audioEnabled.value);
}

async function focusActiveGame() {
  await nextTick();
  const root = gameFrameRef.value;
  if (!root) return;

  const focusTarget = root.querySelector<HTMLElement>('[tabindex="0"], button:not([disabled])');
  focusTarget?.focus();
}

onMounted(() => {
  loadStreak();
  refreshScores();
  syncAchievements();
  audioEnabled.value = getArcadeAudioEnabled();
  void focusActiveGame();
  window.addEventListener(AUDIO_EVENT, handleAudioChange);
  window.addEventListener(SCORE_EVENT, handleScoreUpdate);
  window.addEventListener('storage', handleStorageChange);
});

watch(selectedGame, () => {
  void focusActiveGame();
});

onUnmounted(() => {
  window.clearTimeout(toastTimer);
  window.removeEventListener(AUDIO_EVENT, handleAudioChange);
  window.removeEventListener(SCORE_EVENT, handleScoreUpdate);
  window.removeEventListener('storage', handleStorageChange);
});
</script>

<style scoped>
.arcade-hub {
  margin: 1rem 0 2rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 1rem;
  align-items: stretch;
}

.hero-copy,
.challenge,
.game-card,
.score-panel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.hero-copy {
  padding: 1.5rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(119, 231, 255, 0.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(255, 167, 99, 0.16), transparent 28%),
    linear-gradient(135deg, rgba(7, 16, 28, 0.98), rgba(15, 8, 25, 0.98));
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: #96eaff;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.hero-copy h1 {
  margin: 0;
  color: #fff;
  line-height: 0.92;
  letter-spacing: -0.05em;
  font-size: clamp(2.4rem, 7vw, 4.8rem);
}

.summary {
  max-width: 42rem;
  margin: 0.9rem 0 0;
  color: rgba(227, 236, 250, 0.8);
  font-size: 1rem;
}

.challenge {
  padding: 1.35rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(255, 202, 113, 0.16), transparent 32%),
    linear-gradient(180deg, rgba(18, 22, 36, 0.98), rgba(12, 11, 27, 0.98));
}

.challenge.is-complete {
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.22),
    0 0 0 1px rgba(123, 250, 202, 0.2) inset;
}

.challenge-label,
.panel-label {
  margin: 0 0 0.45rem;
  color: rgba(208, 223, 246, 0.7);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.challenge h3 {
  margin: 0;
  color: #fff;
  font-size: 1.6rem;
}

.challenge-target {
  margin: 0.65rem 0 0;
  color: #ffdb8a;
  font-weight: 700;
}

.challenge-status {
  margin: 0.75rem 0 0;
  color: rgba(230, 236, 245, 0.82);
}

.streak {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(235, 241, 250, 0.84);
}

.streak strong {
  color: #fff0a0;
}

.selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.game-card {
  display: grid;
  gap: 0.35rem;
  padding: 1.1rem;
  border-radius: 24px;
  color: #eef5ff;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
    linear-gradient(135deg, rgba(10, 16, 29, 0.98), rgba(18, 11, 32, 0.98));
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.game-card:hover {
  transform: translateY(-3px);
}

.game-card.is-active {
  border-color: rgba(152, 236, 255, 0.34);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.22),
    0 0 0 1px rgba(152, 236, 255, 0.22) inset;
}

.game-icon {
  font-size: 1.45rem;
}

.game-name {
  font-size: 1.12rem;
  font-weight: 700;
}

.game-meta {
  color: rgba(216, 226, 241, 0.72);
  font-size: 0.95rem;
}

.game-score {
  margin-top: 0.35rem;
  color: #91eeff;
}

.board {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.7fr);
  gap: 1rem;
  align-items: start;
  margin-top: 1rem;
}

.scoreboard {
  display: grid;
  gap: 1rem;
}

.score-panel {
  padding: 1.1rem;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(141, 229, 255, 0.1), transparent 34%),
    linear-gradient(180deg, rgba(11, 18, 31, 0.98), rgba(12, 9, 23, 0.98));
}

.score-panel ol,
.score-panel ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.score-panel li {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(228, 237, 248, 0.84);
}

.score-panel li:first-child {
  border-top: 0;
  padding-top: 0.1rem;
}

.score-panel strong {
  color: #fff;
}

.audio-toggle {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 0.85rem 0.95rem;
  color: #06111f;
  font-weight: 700;
  background: linear-gradient(135deg, #9af2ff, #ffd57c);
  cursor: pointer;
}

.audio-toggle.is-off {
  color: rgba(228, 237, 248, 0.86);
  background: rgba(255, 255, 255, 0.04);
}

.achievement-list li {
  align-items: flex-start;
}

.achievement-list li div {
  display: grid;
  gap: 0.22rem;
}

.achievement-list li span {
  color: rgba(216, 226, 241, 0.7);
  font-size: 0.92rem;
}

.achievement-list li em {
  font-style: normal;
  color: rgba(255, 215, 123, 0.72);
  white-space: nowrap;
}

.achievement-list li.is-unlocked strong {
  color: #ffe391;
}

.toast {
  position: fixed;
  right: 1.2rem;
  bottom: 1.2rem;
  z-index: 30;
  display: grid;
  gap: 0.25rem;
  min-width: min(320px, calc(100vw - 2.4rem));
  padding: 1rem 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  color: #f5fbff;
  background:
    radial-gradient(circle at top left, rgba(143, 241, 255, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(7, 16, 28, 0.96), rgba(15, 8, 25, 0.96));
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(12px);
}

.toast strong {
  color: #fff;
}

.toast span {
  color: rgba(226, 236, 249, 0.84);
}

.toast-pop-enter-active,
.toast-pop-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 960px) {
  .hero,
  .board {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .selector {
    grid-template-columns: 1fr;
  }
}
</style>
