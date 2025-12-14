import { createRouter, createWebHistory } from 'vue-router';
import ChatApp from '@/components/ChatApp.vue';
import Settings from '@/components/Settings.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatApp,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
  ],
});

export default router;
