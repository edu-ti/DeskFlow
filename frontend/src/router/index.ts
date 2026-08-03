import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import TicketsView from '../views/TicketsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: DashboardLayout,
      children: [
        {
          path: '',
          redirect: '/tickets'
        },
        {
          path: 'tickets',
          name: 'tickets',
          component: TicketsView,
        },
        {
          path: 'tickets/:id',
          name: 'ticket-detail',
          component: () => import('../views/TicketDetailView.vue'),
        }
      ]
    },
  ],
})

export default router
