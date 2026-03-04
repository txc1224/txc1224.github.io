<template>
  <div class="giscus-wrapper">
    <component
      v-if="showComment"
      :is="'giscus-widget'"
      repo="txc1224/txc1224.github.io"
      repoid="R_kgDOMDaZmg"
      category="Announcements"
      categoryid="DIC_kwDOMDaZms4C3qng"
      mapping="pathname"
      strict="0"
      reactionsenabled="1"
      emitmetadata="0"
      inputposition="top"
      :theme="isDark ? 'dark' : 'light'"
      lang="zh-CN"
      loading="lazy"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useData, useRoute } from 'vitepress';

const route = useRoute();
const { isDark } = useData();
const showComment = ref(false);

onMounted(async () => {
  await import('giscus');
  showComment.value = true;
});

// 路由变化时刷新评论
watch(
  () => route.path,
  () => {
    showComment.value = false;
    setTimeout(() => {
      showComment.value = true;
    }, 200);
  },
);
</script>

<style scoped>
.giscus-wrapper {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
