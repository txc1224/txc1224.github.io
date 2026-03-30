<template>
  <section class="signal-tap">
    <div class="panel">
      <div class="panel-copy">
        <p class="eyebrow">Reaction Game</p>
        <h2>Signal Tap</h2>
        <p class="summary">盯住高亮信号格，尽快点中它。每轮会越来越快，漏掉三次就结束。</p>
      </div>

      <div class="status-bar">
        <div>
          <span class="label">Score</span>
          <strong>{{ score }}</strong>
        </div>
        <div>
          <span class="label">Best</span>
          <strong>{{ bestScore }}</strong>
        </div>
        <div>
          <span class="label">Lives</span>
          <strong>{{ lives }}</strong>
        </div>
        <div>
          <span class="label">Pace</span>
          <strong>{{ Math.round(activeDuration) }} ms</strong>
        </div>
      </div>

      <div class="grid" :class="{ 'is-running': status === 'running' }">
        <button
          v-for="cell in cells"
          :key="cell"
          class="cell"
          type="button"
          :class="{
            'is-active': activeCell === cell,
            'is-miss': flashMiss && activeCell !== cell,
          }"
          :disabled="status === 'idle'"
          @click="hitCell(cell)"
        >
          <span>{{ cell + 1 }}</span>
        </button>
      </div>

      <div class="footer">
        <div class="note">
          {{
            status === 'running'
              ? '保持节奏，别让高亮格子超时。'
              : status === 'over'
                ? `结束了，你拿到 ${score} 分。`
                : '点击开始后，尽快击中高亮格。'
          }}
        </div>
        <button class="action" type="button" @click="startGame">
          {{ status === 'running' ? '重新开局' : status === 'over' ? '再来一次' : '开始挑战' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { dispatchArcadeScoreUpdate, playArcadeTone } from '../utils/arcade';

const STORAGE_KEY = 'signal-tap-best-score';
const CELL_COUNT = 9;

const cells = Array.from({ length: CELL_COUNT }, (_, index) => index);

const activeCell = ref(-1);
const score = ref(0);
const bestScore = ref(0);
const lives = ref(3);
const activeDuration = ref(1200);
const status = ref<'idle' | 'running' | 'over'>('idle');
const flashMiss = ref(false);

let roundTimer = 0;
let missFlashTimer = 0;

function loadBestScore() {
  if (typeof window === 'undefined') return;
  const saved = Number(window.localStorage.getItem(STORAGE_KEY) || '0');
  bestScore.value = Number.isFinite(saved) ? saved : 0;
  dispatchArcadeScoreUpdate('Signal Tap', STORAGE_KEY, bestScore.value);
}

function persistBestScore() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, String(bestScore.value));
  dispatchArcadeScoreUpdate('Signal Tap', STORAGE_KEY, bestScore.value);
}

function clearTimers() {
  window.clearTimeout(roundTimer);
  window.clearTimeout(missFlashTimer);
}

function endGame() {
  status.value = 'over';
  activeCell.value = -1;
  clearTimers();
  playArcadeTone({ frequency: 210, sweepTo: 120, duration: 0.26, gain: 0.08, type: 'sawtooth' });

  if (score.value > bestScore.value) {
    bestScore.value = score.value;
    persistBestScore();
  }
}

function chooseNextCell() {
  let next = Math.floor(Math.random() * CELL_COUNT);
  if (next === activeCell.value) {
    next = (next + 1) % CELL_COUNT;
  }
  activeCell.value = next;
}

function triggerMiss() {
  lives.value -= 1;
  flashMiss.value = true;
  playArcadeTone({ frequency: 250, sweepTo: 180, duration: 0.16, gain: 0.05, type: 'square' });
  window.clearTimeout(missFlashTimer);
  missFlashTimer = window.setTimeout(() => {
    flashMiss.value = false;
  }, 220);

  if (lives.value <= 0) {
    endGame();
    return;
  }

  queueRound();
}

function queueRound() {
  clearTimers();
  chooseNextCell();
  roundTimer = window.setTimeout(() => {
    if (status.value !== 'running') return;
    triggerMiss();
  }, activeDuration.value);
}

function startGame() {
  score.value = 0;
  lives.value = 3;
  activeDuration.value = 1200;
  flashMiss.value = false;
  status.value = 'running';
  queueRound();
}

function hitCell(cell: number) {
  if (status.value !== 'running') return;
  if (cell !== activeCell.value) {
    triggerMiss();
    return;
  }

  score.value += 1;
  activeDuration.value = Math.max(380, activeDuration.value - 36);
  playArcadeTone({ frequency: 740, sweepTo: 980, duration: 0.09, gain: 0.04, type: 'triangle' });
  queueRound();
}

onMounted(() => {
  loadBestScore();
});

onUnmounted(() => {
  clearTimers();
});
</script>

<style scoped>
.signal-tap {
  margin: 2rem 0 0;
}

.panel {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(255, 196, 92, 0.18), transparent 34%),
    radial-gradient(circle at bottom left, rgba(79, 182, 255, 0.18), transparent 32%),
    linear-gradient(180deg, rgba(15, 20, 32, 0.98), rgba(8, 12, 23, 0.98));
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.panel-copy {
  padding: 1.5rem 1.5rem 0.9rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: #ffd476;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.panel-copy h2 {
  margin: 0;
  font-size: clamp(1.9rem, 5vw, 3.1rem);
  line-height: 0.94;
  color: #fcfdff;
}

.summary {
  max-width: 40rem;
  margin: 0.75rem 0 0;
  color: rgba(229, 236, 246, 0.78);
}

.status-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0 1.5rem;
}

.status-bar div {
  padding: 0.8rem 0.9rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.label {
  display: block;
  margin-bottom: 0.25rem;
  color: rgba(208, 223, 246, 0.68);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-bar strong {
  color: #fff;
  font-size: 1.1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  padding: 1.5rem;
}

.cell {
  position: relative;
  aspect-ratio: 1;
  border: 0;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(75, 97, 135, 0.3), rgba(32, 44, 68, 0.8)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent);
  color: rgba(255, 255, 255, 0.36);
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;
}

.cell:hover {
  transform: translateY(-2px);
}

.cell:disabled {
  cursor: default;
}

.cell.is-active {
  color: #0d1727;
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.78), transparent 24%),
    linear-gradient(135deg, #fff4a6, #ffb44f 55%, #ff8454);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18) inset,
    0 18px 40px rgba(255, 160, 77, 0.24);
  transform: scale(1.02);
}

.cell.is-miss {
  animation: shake 0.18s linear 1;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
}

.note {
  color: rgba(221, 230, 242, 0.72);
}

.action {
  border: 0;
  border-radius: 999px;
  padding: 0.88rem 1.2rem;
  background: linear-gradient(135deg, #ffe17e, #ff9f52);
  color: #121621;
  font-weight: 700;
  cursor: pointer;
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-4px);
  }

  75% {
    transform: translateX(4px);
  }

  100% {
    transform: translateX(0);
  }
}

@media (max-width: 640px) {
  .panel-copy {
    padding: 1.2rem 1.2rem 0.75rem;
  }

  .status-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0 1.2rem;
  }

  .grid {
    gap: 0.7rem;
    padding: 1.2rem;
  }

  .footer {
    flex-direction: column;
    align-items: stretch;
    padding: 0 1.2rem 1.2rem;
  }
}
</style>
