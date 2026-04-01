import { defineAsyncComponent, nextTick } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';
import MusicPlayer from './components/MusicPlayer.vue';
import './style.css';

const ArcadeHub = defineAsyncComponent(() => import('./components/ArcadeHub.vue'));
const LaneSprint = defineAsyncComponent(() => import('./components/LaneSprint.vue'));
const MeteorHop = defineAsyncComponent(() => import('./components/MeteorHop.vue'));
const SignalTap = defineAsyncComponent(() => import('./components/SignalTap.vue'));
const HomeDiscover = defineAsyncComponent(() => import('./components/HomeDiscover.vue'));
const HomeStage = defineAsyncComponent(() => import('./components/HomeStage.vue'));
const ArchiveExplorer = defineAsyncComponent(() => import('./components/ArchiveExplorer.vue'));
const TagExplorer = defineAsyncComponent(() => import('./components/TagExplorer.vue'));
const DailyDigestHub = defineAsyncComponent(() => import('./components/DailyDigestHub.vue'));

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router }) {
    app.component('ArcadeHub', ArcadeHub);
    app.component('LaneSprint', LaneSprint);
    app.component('MeteorHop', MeteorHop);
    app.component('SignalTap', SignalTap);
    app.component('HomeDiscover', HomeDiscover);
    app.component('HomeStage', HomeStage);
    app.component('ArchiveExplorer', ArchiveExplorer);
    app.component('TagExplorer', TagExplorer);
    app.component('DailyDigestHub', DailyDigestHub);
    app.component('MusicPlayer', MusicPlayer);

    if (typeof window === 'undefined') return;

    // View Transitions 页面切换动画
    if ((document as any).startViewTransition) {
      router.onBeforeRouteChange = () => {
        const transition = (document as any).startViewTransition(async () => {
          await nextTick();
        });
        return transition.ready;
      };
    }
  },
} satisfies Theme;
