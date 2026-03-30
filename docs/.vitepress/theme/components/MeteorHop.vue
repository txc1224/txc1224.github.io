<template>
  <section class="meteor-hop">
    <div class="game-shell">
      <div class="game-copy">
        <p class="eyebrow">Mini Game</p>
        <h2>Meteor Hop</h2>
        <p class="summary">按空格、上箭头或点击屏幕起跳，躲开越来越快的陨石。坚持越久，速度越高。</p>
      </div>

      <div
        ref="arenaRef"
        class="arena"
        :class="{
          'is-running': state.status === 'running',
          'is-over': state.status === 'over',
        }"
        tabindex="0"
        role="button"
        aria-label="Meteor Hop game area"
        @click="handleAction"
        @keydown.space.prevent="handleAction"
        @keydown.up.prevent="handleAction"
      >
        <div class="hud">
          <div>
            <span class="label">Score</span>
            <strong>{{ state.score }}</strong>
          </div>
          <div>
            <span class="label">Best</span>
            <strong>{{ bestScore }}</strong>
          </div>
          <div>
            <span class="label">Speed</span>
            <strong>{{ speedText }}</strong>
          </div>
        </div>

        <div class="skyline">
          <span v-for="star in stars" :key="star.id" class="star" :style="starStyle(star)" />
        </div>

        <div class="aurora aurora-a" />
        <div class="aurora aurora-b" />

        <div class="ground">
          <div class="ground-grid" />
        </div>

        <div class="player" :style="playerStyle">
          <div class="player-core" />
          <div class="player-shadow" />
        </div>

        <div v-for="obstacle in state.obstacles" :key="obstacle.id" class="obstacle" :style="obstacleStyle(obstacle)">
          <span class="obstacle-glow" />
        </div>

        <div v-if="state.status !== 'running'" class="overlay">
          <p class="overlay-title">
            {{ state.status === 'idle' ? '准备起跳' : '撞上陨石了' }}
          </p>
          <p class="overlay-text">
            {{ state.status === 'idle' ? '点击场地或按空格开始。' : `本局 ${state.score} 分，点击再来一把。` }}
          </p>
          <button class="overlay-button" type="button" @click.stop="handleAction">
            {{ state.status === 'idle' ? '开始游戏' : '重新开始' }}
          </button>
        </div>
      </div>

      <div class="tips">
        <span>控制：空格 / ↑ / 点击 / 触屏</span>
        <span>目标：单键节奏躲避</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref } from 'vue';
import { dispatchArcadeScoreUpdate, playArcadeTone } from '../utils/arcade';
import { ARCADE_STORAGE_KEYS, readNumberStorage, writeNumberStorage } from '../utils/arcade-storage.mjs';
import { canMeteorHopJump } from '../utils/meteor-hop-state.mjs';

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  hue: number;
  passed: boolean;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
}

const PLAYER_SIZE = 42;
const PLAYER_X = 72;
const GROUND_HEIGHT = 68;
const GRAVITY = 1800;
const JUMP_VELOCITY = 760;
const BASE_SPEED = 360;
const MAX_SPEED = 760;
const STORAGE_KEY = ARCADE_STORAGE_KEYS.meteorHopBest;

const arenaRef = ref<HTMLDivElement | null>(null);
const arenaWidth = ref(920);
const bestScore = ref(0);

const state = reactive({
  status: 'idle' as 'idle' | 'running' | 'over',
  score: 0,
  y: 0,
  velocity: 0,
  speed: BASE_SPEED,
  obstacles: [] as Obstacle[],
});

const stars: Star[] = Array.from({ length: 20 }, (_, index) => ({
  id: index,
  x: 6 + Math.random() * 88,
  y: 8 + Math.random() * 54,
  size: 2 + Math.random() * 4,
  alpha: 0.25 + Math.random() * 0.65,
}));

let rafId = 0;
let lastTime = 0;
let spawnTimer = 0;
let obstacleId = 0;
let resizeObserver: ResizeObserver | null = null;
let isLoopActive = false;

const speedText = computed(() => `${Math.round(state.speed)} px/s`);

const playerStyle = computed(() => ({
  width: `${PLAYER_SIZE}px`,
  height: `${PLAYER_SIZE}px`,
  transform: `translate3d(${PLAYER_X}px, ${-state.y}px, 0)`,
}));

function starStyle(star: Star) {
  return {
    left: `${star.x}%`,
    top: `${star.y}%`,
    width: `${star.size}px`,
    height: `${star.size}px`,
    opacity: String(star.alpha),
    animationDelay: `${star.id * 0.3}s`,
  };
}

function obstacleStyle(obstacle: Obstacle) {
  return {
    left: `${obstacle.x}px`,
    width: `${obstacle.width}px`,
    height: `${obstacle.height}px`,
    '--meteor-hue': String(obstacle.hue),
  };
}

function clampArenaWidth() {
  if (!arenaRef.value) return;
  arenaWidth.value = Math.max(arenaRef.value.clientWidth, 320);
}

function resetGame() {
  state.status = 'idle';
  state.score = 0;
  state.y = 0;
  state.velocity = 0;
  state.speed = BASE_SPEED;
  state.obstacles = [];
  spawnTimer = 0.95;
  lastTime = 0;
}

function storeBestScore() {
  if (typeof window === 'undefined') return;
  writeNumberStorage(STORAGE_KEY, bestScore.value);
  dispatchArcadeScoreUpdate('Meteor Hop', STORAGE_KEY, bestScore.value);
}

function startGame() {
  resetGame();
  state.status = 'running';
  jump();
  arenaRef.value?.focus();
}

function endGame() {
  state.status = 'over';
  playArcadeTone({ frequency: 220, sweepTo: 110, duration: 0.28, gain: 0.08, type: 'sawtooth' });
  if (state.score > bestScore.value) {
    bestScore.value = state.score;
    storeBestScore();
  }
}

function jump() {
  if (!canMeteorHopJump(state.y, state.velocity)) return;
  state.velocity = JUMP_VELOCITY;
  playArcadeTone({ frequency: 480, sweepTo: 720, duration: 0.12, gain: 0.045, type: 'triangle' });
}

function handleAction() {
  if (state.status === 'idle') {
    startGame();
    return;
  }
  if (state.status === 'over') {
    startGame();
    return;
  }
  jump();
}

function createObstacle() {
  const width = 26 + Math.random() * 44;
  const height = 36 + Math.random() * 60;
  state.obstacles.push({
    id: obstacleId++,
    x: arenaWidth.value + width,
    width,
    height,
    hue: 18 + Math.random() * 20,
    passed: false,
  });
}

function intersects(obstacle: Obstacle) {
  const playerLeft = PLAYER_X + 4;
  const playerRight = PLAYER_X + PLAYER_SIZE - 4;
  const playerBottom = GROUND_HEIGHT + 2;
  const playerTop = playerBottom + PLAYER_SIZE - 10 + state.y;

  const obstacleLeft = obstacle.x;
  const obstacleRight = obstacle.x + obstacle.width;
  const obstacleBottom = GROUND_HEIGHT;
  const obstacleTop = obstacleBottom + obstacle.height;

  return (
    playerRight > obstacleLeft && playerLeft < obstacleRight && playerTop > obstacleBottom && playerBottom < obstacleTop
  );
}

function tick(timestamp: number) {
  if (!isLoopActive) return;
  rafId = requestAnimationFrame(tick);

  if (state.status !== 'running') {
    lastTime = timestamp;
    return;
  }

  if (!lastTime) {
    lastTime = timestamp;
    return;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.032);
  lastTime = timestamp;

  state.velocity -= GRAVITY * dt;
  state.y += state.velocity * dt;
  if (state.y < 0) {
    state.y = 0;
    state.velocity = 0;
  }

  state.speed = Math.min(BASE_SPEED + state.score * 18, MAX_SPEED);
  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    createObstacle();
    const densityFactor = Math.max(0.56, 1 - state.score * 0.018);
    spawnTimer = (0.9 + Math.random() * 0.55) * densityFactor;
  }

  state.obstacles = state.obstacles
    .map((obstacle) => ({ ...obstacle, x: obstacle.x - state.speed * dt }))
    .filter((obstacle) => obstacle.x + obstacle.width > -60);

  for (const obstacle of state.obstacles) {
    if (!obstacle.passed && obstacle.x + obstacle.width < PLAYER_X) {
      obstacle.passed = true;
      state.score += 1;
      playArcadeTone({ frequency: 660, sweepTo: 840, duration: 0.08, gain: 0.04, type: 'triangle' });
    }
    if (intersects(obstacle)) {
      endGame();
      break;
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
  if (typeof window !== 'undefined') {
    bestScore.value = readNumberStorage(STORAGE_KEY, 0);
    dispatchArcadeScoreUpdate('Meteor Hop', STORAGE_KEY, bestScore.value);
  }

  clampArenaWidth();
  resizeObserver = new ResizeObserver(clampArenaWidth);
  if (arenaRef.value) {
    resizeObserver.observe(arenaRef.value);
  }

  resetGame();
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
.meteor-hop {
  margin: 2rem 0;
}

.game-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(97, 214, 255, 0.22), transparent 32%),
    radial-gradient(circle at 85% 20%, rgba(255, 150, 92, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(8, 18, 35, 0.98), rgba(18, 11, 31, 0.98));
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.game-copy {
  padding: 1.5rem 1.5rem 0.75rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: #89d8ff;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.game-copy h2 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.6rem);
  line-height: 0.94;
  letter-spacing: -0.04em;
  color: #f5fbff;
}

.summary {
  max-width: 42rem;
  margin: 0.85rem 0 0;
  color: rgba(236, 243, 255, 0.78);
  font-size: 1rem;
}

.arena {
  position: relative;
  height: 360px;
  margin: 1rem 1rem 0;
  border-radius: 24px;
  overflow: hidden;
  outline: none;
  cursor: pointer;
  background:
    linear-gradient(180deg, rgba(78, 124, 196, 0.22), transparent 46%),
    radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #09111f 0%, #0d1930 54%, #11151f 100%);
}

.hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.hud div {
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(6, 13, 24, 0.42);
  backdrop-filter: blur(12px);
}

.label {
  display: block;
  margin-bottom: 0.25rem;
  color: rgba(208, 223, 246, 0.7);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hud strong {
  color: #ffffff;
  font-size: 1.15rem;
}

.skyline {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  display: block;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.45);
  animation: twinkle 3.4s ease-in-out infinite;
}

.aurora {
  position: absolute;
  inset: auto;
  filter: blur(18px);
  opacity: 0.85;
}

.aurora-a {
  top: 4.5rem;
  right: 12%;
  width: 22rem;
  height: 8rem;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(104, 232, 255, 0), rgba(104, 232, 255, 0.34), rgba(104, 232, 255, 0));
}

.aurora-b {
  top: 6.25rem;
  left: 8%;
  width: 18rem;
  height: 6rem;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 129, 99, 0), rgba(255, 129, 99, 0.28), rgba(255, 129, 99, 0));
}

.ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 68px;
  background:
    linear-gradient(180deg, rgba(49, 88, 143, 0.08), transparent 24%), linear-gradient(180deg, #181929, #10141f);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.ground-grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(125, 207, 255, 0.14) 1px, transparent 1px),
    linear-gradient(180deg, rgba(125, 207, 255, 0.12) 1px, transparent 1px);
  background-size:
    38px 100%,
    100% 18px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.92), transparent);
}

.player {
  position: absolute;
  left: 0;
  bottom: 68px;
  z-index: 3;
  will-change: transform;
}

.player-core {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background:
    radial-gradient(circle at 35% 30%, #fdf6d4 0 18%, transparent 19%),
    radial-gradient(circle at 62% 58%, rgba(255, 255, 255, 0.5), transparent 24%),
    linear-gradient(135deg, #ffe781 0%, #ff9d51 56%, #ff684e 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 12px 24px rgba(255, 122, 80, 0.28);
}

.player-shadow {
  position: absolute;
  left: 50%;
  bottom: -16px;
  width: 36px;
  height: 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  transform: translateX(-50%);
  filter: blur(2px);
}

.obstacle {
  position: absolute;
  bottom: 68px;
  z-index: 2;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.65), transparent 22%),
    radial-gradient(circle at 62% 70%, rgba(255, 173, 111, 0.38), transparent 30%),
    linear-gradient(
      140deg,
      hsl(var(--meteor-hue) 95% 72%) 0%,
      hsl(calc(var(--meteor-hue) + 12) 88% 55%) 46%,
      hsl(calc(var(--meteor-hue) + 18) 72% 38%) 100%
    );
  box-shadow:
    0 0 24px rgba(255, 132, 66, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.obstacle-glow {
  position: absolute;
  inset: auto auto 14% -18%;
  width: 72%;
  height: 24%;
  border-radius: 999px;
  background: rgba(255, 211, 160, 0.4);
  filter: blur(8px);
  transform: rotate(-18deg);
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(180deg, rgba(6, 10, 18, 0.28), rgba(6, 10, 18, 0.56));
  backdrop-filter: blur(2px);
}

.overlay-title {
  margin: 0;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 700;
  color: #ffffff;
}

.overlay-text {
  margin: 0.65rem 0 1rem;
  color: rgba(236, 243, 255, 0.82);
}

.overlay-button {
  border: 0;
  border-radius: 999px;
  padding: 0.9rem 1.2rem;
  color: #04111f;
  font-weight: 700;
  background: linear-gradient(135deg, #89eeff, #ffc668);
  box-shadow: 0 10px 30px rgba(137, 238, 255, 0.24);
  cursor: pointer;
}

.tips {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1.25rem 1.25rem;
  color: rgba(212, 224, 243, 0.7);
  font-size: 0.92rem;
}

.is-running .player-core {
  animation: pulse 0.8s ease-in-out infinite alternate;
}

.is-over .player-core {
  filter: grayscale(0.2) saturate(0.8);
}

@keyframes twinkle {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.45;
  }

  50% {
    transform: scale(1.16);
    opacity: 1;
  }
}

@keyframes pulse {
  from {
    transform: scale(0.98);
  }

  to {
    transform: scale(1.04);
  }
}

@media (max-width: 640px) {
  .game-copy {
    padding: 1.2rem 1.2rem 0.4rem;
  }

  .arena {
    height: 320px;
    margin: 0.8rem 0.8rem 0;
  }

  .hud {
    grid-template-columns: 1fr;
  }

  .tips {
    flex-direction: column;
    padding: 0.85rem 1rem 1rem;
  }
}
</style>
