<template>
  <section class="content-explorer">
    <header class="explorer-header">
      <p class="panel-kicker">Tags</p>
      <h1>按标签发现内容</h1>
      <p>标签页适合横向串联不同专题里的高频概念，减少只靠目录查找的成本。</p>
    </header>

    <div class="tag-cloud">
      <a v-for="tag in tagEntries" :key="tag.name" class="tag-pill" :href="tag.href">
        <strong>#{{ tag.name }}</strong>
        <span>{{ tag.count }}</span>
      </a>
    </div>

    <div class="tag-sections">
      <article v-for="tag in tagEntries" :id="tag.name" :key="tag.name" class="tag-section">
        <div class="tag-section__head">
          <h2>#{{ tag.name }}</h2>
          <span>{{ tag.count }} 篇</span>
        </div>

        <div class="featured-list">
          <a v-for="note in tag.notes" :key="note.href" class="featured-item" :href="note.href">
            <strong>{{ note.title }}</strong>
            <span>{{ note.description }}</span>
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { tagEntries } from '../data/site-content';
</script>
