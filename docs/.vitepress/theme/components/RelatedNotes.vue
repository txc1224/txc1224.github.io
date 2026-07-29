<template>
  <section v-if="visible && related.length" class="related-notes">
    <div class="related-notes__head">
      <p class="panel-kicker">Keep Reading</p>
      <h2>相关推荐</h2>
    </div>

    <div class="featured-list">
      <a v-for="item in related" :key="item.href" class="featured-item" :href="item.href">
        <strong>{{ item.title }}</strong>
        <span>{{ item.description }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { getRelatedNotes } from '../data/site-content';

const { page } = useData();

const visible = computed(() => {
  const relativePath = page.value.relativePath;
  if (!relativePath) return false;
  if (!relativePath.endsWith('.md')) return false;
  if (/^(index|daily-tech\/|bookmarks\/|archive\/|tags\/)/.test(relativePath)) return false;
  return !/\/index\.md$/.test(relativePath);
});

const related = computed(() =>
  getRelatedNotes(
    page.value.filePath
      ? `/${page.value.filePath.replace(/\.md$/, '')}`
      : page.value.relativePath
        ? `/${page.value.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')}`
        : '',
  ),
);
</script>
