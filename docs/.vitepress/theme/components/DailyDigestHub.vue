<template>
  <section class="content-explorer">
    <header class="explorer-header explorer-header--split">
      <div>
        <p class="panel-kicker">Daily Tech</p>
        <h1>把日报当成信息流来读</h1>
        <p>不再只是按日期翻页。这里直接展示最近几期的重点话题，适合快速决定今天值不值得点进去。</p>
      </div>
      <a class="archive-card__link" href="/daily-tech.xml">订阅 RSS</a>
    </header>

    <div class="daily-hub-grid">
      <article v-if="latest" class="daily-hero-card">
        <p class="panel-kicker">Latest Issue</p>
        <h2>{{ latest.date }}</h2>
        <p>{{ latest.description }}</p>
        <ul>
          <li v-for="item in latest.highlights" :key="item">{{ item }}</li>
        </ul>
        <a class="archive-card__link" :href="latest.href">阅读最新一期</a>
      </article>

      <div class="daily-feed">
        <article v-for="entry in restEntries" :key="entry.date" class="daily-feed-card">
          <div class="daily-feed-card__head">
            <strong>{{ entry.date }}</strong>
            <a :href="entry.href">查看</a>
          </div>
          <p>{{ entry.description }}</p>
          <ul>
            <li v-for="item in entry.highlights" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { dailyDigestEntries } from '../data/site-content';

const latest = computed(() => dailyDigestEntries[0]);
const restEntries = computed(() => dailyDigestEntries.slice(1, 9));
</script>
