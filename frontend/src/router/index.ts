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
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
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
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('../views/admin/UsersView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/groups',
          name: 'admin-groups',
          component: () => import('../views/admin/GroupsView.vue'),
          meta: { requiresAdmin: true }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  
  if (to.name !== 'login' && !token) {
    next({ name: 'login' })
  } else if (to.meta.requiresAdmin) {
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.roles && user.roles.includes('admin')) {
        next()
      } else {
        next({ name: 'dashboard' }) // Redirect non-admins away
      }
    } else {
      next({ name: 'login' })
    }
  } else {
    next()
  }
})

export default router
