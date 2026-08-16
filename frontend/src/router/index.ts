import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CustomerLayout from '../layouts/CustomerLayout.vue'
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
      path: '/portal',
      component: CustomerLayout,
      children: [
        {
          path: '',
          name: 'portal-dashboard',
          component: () => import('../views/customer/CustomerDashboard.vue'),
        },
        {
          path: 'new',
          name: 'portal-ticket-new',
          component: () => import('../views/customer/CustomerTicketNew.vue'),
        },
        {
          path: 'tickets/:id',
          name: 'portal-ticket-detail',
          component: () => import('../views/TicketDetailView.vue'), // Reusing for now
        },
        {
          path: 'kb',
          name: 'portal-kb',
          component: () => import('../views/customer/CustomerKbView.vue'),
        },
        {
          path: 'kb/categories/:id',
          name: 'portal-kb-category',
          component: () => import('../views/customer/CustomerKbCategoryView.vue'),
        },
        {
          path: 'kb/articles/:id',
          name: 'portal-kb-article',
          component: () => import('../views/customer/CustomerKbArticleView.vue'),
        }
      ]
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
          component: () => import('../views/admin/DashboardHomeView.vue'),
        },
        {
          path: '/omnichannel',
          name: 'omnichannel',
          component: () => import('../views/OmnichannelView.vue'),
          meta: { requiresAuth: true }
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
          path: 'kb',
          name: 'kb',
          component: () => import('../views/kb/KnowledgeBaseView.vue'),
        },
        {
          path: 'kb/:id',
          name: 'kb-article',
          component: () => import('../views/kb/ArticleDetailView.vue'),
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
        },
        {
          path: 'admin/custom-fields',
          name: 'admin-custom-fields',
          component: () => import('../views/admin/CustomFieldsView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/kb',
          name: 'admin-kb',
          component: () => import('../views/admin/KbAdminView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/macros',
          name: 'admin-macros',
          component: () => import('../views/admin/MacrosView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/triggers',
          name: 'admin-triggers',
          component: () => import('../views/admin/TriggersView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/analytics',
          name: 'admin-analytics',
          component: () => import('../views/admin/AnalyticsView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/settings',
          name: 'admin-settings',
          component: () => import('../views/admin/SettingsView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/sla-policies',
          name: 'admin-sla-policies',
          component: () => import('../views/admin/SlaPoliciesView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/audit',
          name: 'admin-audit',
          component: () => import('../views/admin/AuditLogsView.vue'),
          meta: { requiresAdmin: true }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/csat/:token',
      name: 'csat',
      component: () => import('../views/customer/CsatView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  let user: any = null
  
  if (userStr) {
    user = JSON.parse(userStr)
  }
  
  if (to.name !== 'login' && to.name !== 'csat' && !token) {
    return { name: 'login' }
  } 
  
  // Protect admin routes
  if (to.meta.requiresAdmin) {
    if (user && user.roles && user.roles.includes('admin')) {
      return true
    } else {
      return { name: 'dashboard' }
    }
  }

  // Prevent customers from accessing dashboard/admin
  if (user && user.roles && user.roles.length === 1 && user.roles.includes('customer')) {
    if (!to.path.startsWith('/portal') && to.name !== 'login') {
      return { path: '/portal' }
    }
  }

  return true
})

export default router
