import { h, nextTick } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import SakuraCanvas from './components/SakuraCanvas.vue';
import GiscusComment from './components/GiscusComment.vue';
import MeteorHop from './components/MeteorHop.vue';
import ArcadeHub from './components/ArcadeHub.vue';
import LaneSprint from './components/LaneSprint.vue';
import SignalTap from './components/SignalTap.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(SakuraCanvas),
      'doc-after': () => h(GiscusComment),
    });
  },
  enhanceApp({ app, router }) {
    app.component('ArcadeHub', ArcadeHub);
    app.component('LaneSprint', LaneSprint);
    app.component('MeteorHop', MeteorHop);
    app.component('SignalTap', SignalTap);

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
