<template>
  <canvas ref="canvasRef" class="sakura-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement>();
let animationId = 0;
let resizeTimer = 0;

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

function createPetal(w: number, h: number): Petal {
  return {
    x: Math.random() * w,
    y: Math.random() * -h,
    size: 8 + Math.random() * 10,
    speedY: 0.8 + Math.random() * 1.2,
    speedX: -0.3 + Math.random() * 0.6,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    opacity: 0.4 + Math.random() * 0.4,
  };
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = `hsl(${340 + Math.random() * 20}, 80%, ${75 + Math.random() * 10}%)`;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(p.size * 0.4, -p.size * 0.3, p.size * 0.8, -p.size * 0.15, p.size, 0);
  ctx.bezierCurveTo(p.size * 0.8, p.size * 0.15, p.size * 0.4, p.size * 0.3, 0, 0);
  ctx.fill();
  ctx.restore();
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isMobile = window.innerWidth < 768;
  const petalCount = isMobile ? 15 : 30;

  function resize() {
    canvas!.width = window.innerWidth;
    canvas!.height = window.innerHeight;
  }
  function debouncedResize() {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  }
  resize();
  window.addEventListener('resize', debouncedResize);

  const petals: Petal[] = Array.from({ length: petalCount }, () => createPetal(canvas!.width, canvas!.height));
  // 初始化时让花瓣散布在整个屏幕
  petals.forEach((p) => {
    p.y = Math.random() * canvas!.height;
  });

  function animate() {
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

    for (const p of petals) {
      // 随风摇曳
      p.x += p.speedX + Math.sin(p.y * 0.01) * 0.5;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      // 落出屏幕后重置到顶部
      if (p.y > canvas!.height + p.size) {
        p.y = -p.size;
        p.x = Math.random() * canvas!.width;
      }
      // 水平越界修正
      if (p.x > canvas!.width + p.size) p.x = -p.size;
      if (p.x < -p.size) p.x = canvas!.width + p.size;

      drawPetal(ctx!, p);
    }

    animationId = requestAnimationFrame(animate);
  }
  animate();

  onUnmounted(() => {
    cancelAnimationFrame(animationId);
    clearTimeout(resizeTimer);
    window.removeEventListener('resize', debouncedResize);
  });
});
</script>

<style scoped>
.sakura-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 50;
}
</style>
