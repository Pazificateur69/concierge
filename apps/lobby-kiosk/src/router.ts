import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('./views/HomeView.vue') },
  { path: '/map', component: () => import('./views/MapView.vue') },
  { path: '/menu', component: () => import('./views/MenuView.vue') },
  { path: '/services', component: () => import('./views/ServicesView.vue') },
  { path: '/spa', component: () => import('./views/SpaView.vue') },
  { path: '/activities', component: () => import('./views/ActivitiesView.vue') },
  { path: '/help', component: () => import('./views/HelpView.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('./views/NotFoundView.vue') },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
