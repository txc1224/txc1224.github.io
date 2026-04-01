<template>
  <section class="content-explorer">
    <header class="explorer-header">
      <p class="panel-kicker">Archive</p>
      <h1>按专题回看全部笔记</h1>
      <p>把零散文档重新整理成可浏览的知识目录，适合按主题系统复习。</p>
    </header>

    <div class="archive-grid">
      <article v-for="group in archiveGroups" :key="group.slug" class="archive-card">
        <div class="archive-card__head">
          <div>
            <span class="section-accent">{{ group.title }}</span>
            <h2>{{ group.title }}</h2>
          </div>
          <strong>{{ group.count }} 篇</strong>
        </div>
        <p>{{ group.description }}</p>
        <ul>
          <li v-for="note in group.notes" :key="note.href">
            <a :href="note.href">{{ note.title }}</a>
          </li>
        </ul>
        <a class="archive-card__link" :href="group.href">进入专题</a>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { archiveGroups } from '../data/site-content';
</script>
