import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  // === Public (DefaultLayout) ===
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/public/HomeView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('@/views/public/ProductListView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/category/:slug',
    name: 'Category',
    component: () => import('@/views/public/CategoryView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/public/SearchView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/public/ProductDetailView.vue'),
    meta: { layout: 'default' }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/public/CartView.vue'),
    meta: { layout: 'default' }
  },

  // === Checkout (DefaultLayout, requiresAuth) ===
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/checkout/CheckoutView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/checkout/confirm',
    name: 'CheckoutConfirm',
    component: () => import('@/views/checkout/CheckoutConfirmView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/checkout/success/:orderNo',
    name: 'CheckoutSuccess',
    component: () => import('@/views/checkout/CheckoutSuccessView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },

  // === Member Center (DefaultLayout, requiresAuth) ===
  {
    path: '/member',
    name: 'MemberHome',
    component: () => import('@/views/member/MemberHomeView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/member/profile',
    name: 'MemberProfile',
    component: () => import('@/views/member/MemberProfileView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/member/addresses',
    name: 'MemberAddresses',
    component: () => import('@/views/member/MemberAddressView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/member/orders',
    name: 'MemberOrders',
    component: () => import('@/views/member/MemberOrderListView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/member/orders/:orderNo',
    name: 'MemberOrderDetail',
    component: () => import('@/views/member/MemberOrderDetailView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/member/points',
    name: 'MemberPoints',
    component: () => import('@/views/member/MemberPointsView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },
  {
    path: '/member/wishlist',
    name: 'MemberWishlist',
    component: () => import('@/views/member/MemberWishlistView.vue'),
    meta: { layout: 'default', requiresAuth: true }
  },

  // === Digital Download ===
  {
    path: '/downloads/:token',
    name: 'Download',
    component: () => import('@/views/download/DownloadView.vue'),
    meta: { layout: 'default' }
  },

  // === Auth (AuthLayout) ===
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth', guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { layout: 'auth', guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { layout: 'auth', guestOnly: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { layout: 'auth', guestOnly: true }
  },

  // === Admin (AdminLayout) ===
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/AdminLoginView.vue'),
    meta: { layout: 'auth', guestOnly: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: () => import('@/views/admin/AdminProductListView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/products/create',
    name: 'AdminProductCreate',
    component: () => import('@/views/admin/AdminProductFormView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/products/:id/edit',
    name: 'AdminProductEdit',
    component: () => import('@/views/admin/AdminProductFormView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/categories',
    name: 'AdminCategories',
    component: () => import('@/views/admin/AdminCategoryView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('@/views/admin/AdminOrderListView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/orders/:orderNo',
    name: 'AdminOrderDetail',
    component: () => import('@/views/admin/AdminOrderDetailView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/members',
    name: 'AdminMembers',
    component: () => import('@/views/admin/AdminMemberListView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/members/:id',
    name: 'AdminMemberDetail',
    component: () => import('@/views/admin/AdminMemberDetailView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/coupons',
    name: 'AdminCoupons',
    component: () => import('@/views/admin/AdminCouponListView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/coupons/create',
    name: 'AdminCouponCreate',
    component: () => import('@/views/admin/AdminCouponFormView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/coupons/:id/edit',
    name: 'AdminCouponEdit',
    component: () => import('@/views/admin/AdminCouponFormView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/points/rules',
    name: 'AdminPointRules',
    component: () => import('@/views/admin/AdminPointRulesView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/reports/sales',
    name: 'AdminSalesReport',
    component: () => import('@/views/admin/AdminSalesReportView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/reports/products',
    name: 'AdminProductReport',
    component: () => import('@/views/admin/AdminProductReportView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/reports/orders',
    name: 'AdminOrderReport',
    component: () => import('@/views/admin/AdminOrderReportView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },
  {
    path: '/admin/settings/admins',
    name: 'AdminAccounts',
    component: () => import('@/views/admin/AdminAccountView.vue'),
    meta: { layout: 'admin', requiresAdmin: true }
  },

  // === 404 ===
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { layout: 'default' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  // Wait for Supabase auth to initialize before checking auth state
  if (!auth.initialized) {
    await new Promise<void>((resolve) => {
      const unwatch = auth.$subscribe(() => {
        if (auth.initialized) {
          unwatch()
          resolve()
        }
      })
      // Fallback timeout to prevent infinite wait
      setTimeout(() => { resolve() }, 2000)
    })
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return next({ name: 'AdminLogin' })
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    if (to.name === 'AdminLogin' && auth.isAdmin) {
      return next({ name: 'AdminDashboard' })
    }
    if (to.name !== 'AdminLogin') {
      return next({ name: 'MemberHome' })
    }
  }

  next()
})

export default router
