import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import LoginPage from '../views/LoginPage.vue';
import OtpPage from '../views/OtpPage.vue';
import TabsPage from '../views/tabs/TabsPage.vue';

import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/tabs/groups',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: '/otp',
    name: 'Otp',
    component: OtpPage,
    meta: { public: true, requiresPendingPhone: true },
  },
  {
    // Group admins: pending dues and manual payment marking. Signed-in users only, like the tabs.
    path: '/admin/groups/:groupId/dues',
    name: 'GroupDues',
    component: () => import('../views/admin/DuesPage.vue'),
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/groups' },
      { path: 'groups', name: 'Groups', component: () => import('../views/tabs/GroupsPage.vue') },
      { path: 'alerts', name: 'Alerts', component: () => import('../views/tabs/AlertsPage.vue') },
      { path: 'loan', name: 'Loan', component: () => import('../views/tabs/LoanPage.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/tabs/ProfilePage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresPendingPhone && !auth.pendingPhone) {
    return { path: '/login', replace: true };
  }
  // Everything except login and OTP requires a signed-in user.
  if (!to.meta.public && !auth.isAuthenticated) {
    return { path: '/login', replace: true };
  }
  // Signed-in users never need the sign-in screens again.
  if (to.meta.public && to.path === '/login' && auth.isAuthenticated) {
    return { path: '/tabs/groups', replace: true };
  }
  return true;
});

export default router;
