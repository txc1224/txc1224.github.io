<template>
  <section class="lane-sprint">
    <div class="shell">
      <div class="copy">
        <p class="eyebrow">Arcade Runner</p>
        <h2>Lane Sprint</h2>
        <p class="summary">在四条能量轨道之间横移，避开坠落障碍。越晚越快，失误一次就结束。</p>
      </div>

      <div
        ref="arenaRef"
        class="arena"
        tabindex="0"
        role="application"
        aria-label="Lane Sprint game"
        @keydown.left.prevent="move(-1)"
        @keydown.right.prevent="move(1)"
      >
        <div class="hud">
          <div>
            <span class="label">Score</span>
            <strong>{{ score }}</strong>
          </div>
          <div>
            <span class="label">Best</span>
            <strong>{{ bestScore }}</strong>
          </div>
          <div>
            <span class="label">Lane</span>
            <strong>{{ playerLane + 1 }}/{{ LANE_COUNT }}</strong>
          </div>
          <div>
            <span class="label">Speed</span>
            <strong>{{ Math.round(speed) }} px/s</strong>
          </div>
        </div>

        <div class="track">
          <div v-for="lane in LANE_COUNT" :key="lane" class="track-lane" />
        </div>

        <div
          class="player"
          :style="{
            transform: `translate3d(${laneX(playerLane)}px, 0, 0)`,
          }"
        >
          <span class="player-glow" />
        </div>

        <div
          v-for="obstacle in obstacles"
          :key="obstacle.id"
          class="obstacle"
          :style="{
            transform: `translate3d(${laneX(obstacle.lane)}px, ${obstacle.y}px, 0)`,
            height: `${obstacle.height}px`,
          }"
        />

        <div v-if="status !== 'running'" class="overlay">
          <p class="overlay-title">
            {{ status === 'idle' ? '切入轨道' : '撞上障碍了' }}
          </p>
          <p class="overlay-text">
            {{ status === 'idle' ? '方向键左右移动，也可以点下面的轨道按钮。' : `本局 ${score} 分，方向感还差一点。` }}
          </p>
          <button class="overlay-button" type="button" @click="startGame">
            {{ status === 'idle' ? '开始冲刺' : '重新冲刺' }}
          </button>
        </div>
      </div>

      <div class="controls">
        <button
          v-for="lane in LANE_COUNT"
          :key="lane"
          class="lane-button"
          type="button"
          :class="{ 'is-active': playerLane === lane - 1 }"
          @click="setLane(lane - 1)"
        >
          轨道 {{ lane }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import { dispatchArcadeScoreUpdate, playArcadeTone } from '../utils/arcade';
import { ARCADE_STORAGE_KEYS, readNumberStorage, writeNumberStorage } from '../utils/arcade-storage.mjs';
import { getLaneChange } from '../utils/lane-sprint-state.mjs';

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  height: number;
  passed: boolean;
}

const STORAGE_KEY = ARCADE_STORAGE_KEYS.laneSprintBest;
const LANE_COUNT = 4;
const ARENA_HEIGHT = 360;
const PLAYER_Y = 270;
const PLAYER_HEIGHT = 48;
const PLAYER_WIDTH = 54;

const arenaRef = ref<HTMLDivElement | null>(null);
const arenaWidth = ref(900);
const status = ref<'idle' | 'running' | 'over'>('idle');
const playerLane = ref(1);
const score = ref(0);
const bestScore = ref(0);
const speed = ref(320);
const obstacles = ref<Obstacle[]>([]);

let rafId = 0;
let lastTime = 0;
let spawnTimer = 0;
let obstacleId = 0;
let resizeObserver: ResizeObserver | null = null;
let isLoopActive = false;

const laneWidth = computed(() => arenaWidth.value / LANE_COUNT);

function dispatchScoreUpdate() {
  dispatchArcadeScoreUpdate('Lane Sprint', STORAGE_KEY, bestScore.value);
}

function loadBestScore() {
  if (typeof window === 'undefined') return;
  bestScore.value = readNumberStorage(STORAGE_KEY, 0);
  dispatchScoreUpdate();
}

function persistBestScore() {
  if (typeof window === 'undefined') return;
  writeNumberStorage(STORAGE_KEY, bestScore.value);
  dispatchScoreUpdate();
}

function laneX(lane: number) {
  return lane * laneWidth.value + (laneWidth.value - PLAYER_WIDTH) / 2;
}

function setArenaWidth() {
  if (!arenaRef.value) return;
  arenaWidth.value = Math.max(arenaRef.value.clientWidth, 320);
}

function resetGame() {
  status.value = 'idle';
  playerLane.value = 1;
  score.value = 0;
  speed.value = 320;
  obstacles.value = [];
  spawnTimer = 0.9;
  lastTime = 0;
}

function setLane(nextLane: number) {
  const laneChange = getLaneChange(playerLane.value, nextLane, LANE_COUNT);
  playerLane.value = laneChange.lane;
  arenaRef.value?.focus();
  if (!laneChange.changed) return;
  playArcadeTone({ frequency: 380 + playerLane.value * 80, duration: 0.06, gain: 0.03, type: 'square' });
}

function move(direction: -1 | 1) {
  if (status.value !== 'running') return;
  setLane(playerLane.value + direction);
}

function createObstacle() {
  const lane = Math.floor(Math.random() * LANE_COUNT);
  const height = 52 + Math.random() * 42;
  obstacles.value.push({
    id: obstacleId++,
    lane,
    y: -height - 20,
    height,
    passed: false,
  });
}

function endGame() {
  status.value = 'over';
  playArcadeTone({ frequency: 200, sweepTo: 90, duration: 0.28, gain: 0.08, type: 'sawtooth' });
  if (score.value > bestScore.value) {
    bestScore.value = score.value;
    persistBestScore();
  }
}

function startGame() {
  resetGame();
  status.value = 'running';
  arenaRef.value?.focus();
}

function tick(timestamp: number) {
  if (!isLoopActive) return;
  rafId = requestAnimationFrame(tick);

  if (status.value !== 'running') {
    lastTime = timestamp;
    return;
  }

  if (!lastTime) {
    lastTime = timestamp;
    return;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.032);
  lastTime = timestamp;

  speed.value = Math.min(320 + score.value * 16, 760);
  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    createObstacle();
    spawnTimer = Math.max(0.36, 0.9 - score.value * 0.018) + Math.random() * 0.18;
  }

  obstacles.value = obstacles.value
    .map((obstacle) => ({ ...obstacle, y: obstacle.y + speed.value * dt }))
    .filter((obstacle) => obstacle.y < ARENA_HEIGHT + 60);

  for (const obstacle of obstacles.value) {
    if (
      obstacle.lane === playerLane.value &&
      obstacle.y + obstacle.height > PLAYER_Y &&
      obstacle.y < PLAYER_Y + PLAYER_HEIGHT
    ) {
      endGame();
      break;
    }

    if (!obstacle.passed && obstacle.y > PLAYER_Y + PLAYER_HEIGHT) {
      obstacle.passed = true;
      score.value += 1;
      playArcadeTone({ frequency: 620, sweepTo: 760, duration: 0.08, gain: 0.04, type: 'triangle' });
    }
  }
}

function startLoop() {
  if (isLoopActive) return;
  isLoopActive = true;
  lastTime = 0;
  rafId = requestAnimationFrame(tick);
}

function stopLoop() {
  isLoopActive = false;
  cancelAnimationFrame(rafId);
}

onMounted(() => {
  loadBestScore();
  setArenaWidth();
  resetGame();

  resizeObserver = new ResizeObserver(setArenaWidth);
  if (arenaRef.value) {
    resizeObserver.observe(arenaRef.value);
  }

  startLoop();
});

onActivated(() => {
  startLoop();
});

onDeactivated(() => {
  stopLoop();
});

onUnmounted(() => {
  stopLoop();
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.lane-sprint {
  margin: 0;
}

.shell {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background:
    radial-gradient(circle at 18% 0%, rgba(116, 235, 255, 0.18), transparent 28%),
    radial-gradient(circle at 100% 100%, rgba(255, 102, 133, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(9, 14, 28, 0.98), rgba(11, 9, 24, 0.98));
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.copy {
  padding: 1.5rem 1.5rem 0.9rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: #8ee8ff;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.copy h2 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.1rem);
  line-height: 0.94;
  color: #ffffff;
}

.summary {
  max-width: 42rem;
  margin: 0.75rem 0 0;
  color: rgba(229, 236, 246, 0.78);
}

.arena {
  position: relative;
  height: 360px;
  margin: 0 1rem;
  overflow: hidden;
  border-radius: 24px;
  outline: none;
  background:
    linear-gradient(180deg, rgba(115, 239, 255, 0.08), transparent 26%),
    linear-gradient(180deg, #08111f, #0b1626 44%, #0a0b18);
}

.hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.hud div {
  padding: 0.8rem 0.9rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
}

.label {
  display: block;
  margin-bottom: 0.25rem;
  color: rgba(208, 223, 246, 0.68);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hud strong {
  color: #fff;
  font-size: 1.1rem;
}

.track {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.track-lane {
  position: relative;
  border-right: 1px solid rgba(142, 232, 255, 0.12);
}

.track-lane::before {
  content: '';
  position: absolute;
  inset: 0 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0 12px, transparent 12px 28px);
  background-size: 100% 34px;
  opacity: 0.35;
}

.player {
  position: absolute;
  bottom: 42px;
  z-index: 3;
  width: 54px;
  height: 48px;
  border-radius: 18px 18px 12px 12px;
  background:
    radial-gradient(circle at 50% 24%, rgba(255, 255, 255, 0.78), transparent 22%),
    linear-gradient(180deg, #7bf4ff, #3cc7ff 48%, #4e65ff);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
    0 18px 40px rgba(60, 199, 255, 0.24);
  transition: transform 0.12s ease;
}

.player-glow {
  position: absolute;
  inset: auto 14% -16px;
  height: 14px;
  border-radius: 999px;
  background: rgba(90, 235, 255, 0.42);
  filter: blur(10px);
}

.obstacle {
  position: absolute;
  z-index: 2;
  width: 54px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 26%),
    linear-gradient(180deg, #ff9a67, #ff5f6d 48%, #b33261);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 12px 24px rgba(255, 95, 109, 0.24);
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(180deg, rgba(6, 10, 18, 0.24), rgba(6, 10, 18, 0.56));
}

.overlay-title {
  margin: 0;
  color: #fff;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.overlay-text {
  margin: 0.7rem 0 1rem;
  color: rgba(236, 243, 255, 0.82);
}

.overlay-button,
.lane-button {
  border: 0;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.overlay-button {
  padding: 0.9rem 1.2rem;
  color: #071423;
  background: linear-gradient(135deg, #8ee8ff, #ffa978);
}

.controls {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 1rem;
}

.lane-button {
  padding: 0.85rem 0.9rem;
  color: rgba(228, 238, 255, 0.86);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.lane-button.is-active {
  color: #06111f;
  background: linear-gradient(135deg, #88f6ff, #74b7ff);
}

@media (max-width: 640px) {
  .copy {
    padding: 1.2rem 1.2rem 0.75rem;
  }

  .arena {
    margin: 0 0.8rem;
  }

  .hud {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0.8rem;
  }
}
</style>
