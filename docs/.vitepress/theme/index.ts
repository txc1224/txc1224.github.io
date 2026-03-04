import { h, nextTick } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import SakuraCanvas from './components/SakuraCanvas.vue';
import GiscusComment from './components/GiscusComment.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(SakuraCanvas),
      'doc-after': () => h(GiscusComment),
    });
  },
  enhanceApp({ router }) {
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
