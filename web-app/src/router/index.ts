import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router';
/* Layout */
import Layout from '@/layout/index.vue';

/**
 * Note: 路由配置�?
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被<keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/landing',
    component: () => import('@/views/landing/index.vue'),
    hidden: true,
    meta: { requiresAuth: false }
  },
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/social-callback',
    hidden: true,
    component: () => import('@/layout/components/SocialCallback/index.vue')
  },
  {
    path: '/login',
    component: () => import('@/views/login.vue'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register.vue'),
    hidden: true
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/error/404.vue'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401.vue'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: '/index',
    children: [
      {
        path: '/index',
        component: () => import('@/views/index.vue'),
        name: 'Index',
        meta: { title: 'Home', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/manage',
    component: Layout,
    redirect: 'noredirect',
    name: 'Manage',
    alwaysShow: true,
    meta: { title: 'Manage Users', icon: 'peoples' },
    children: [
      {
        path: 'students',
        component: () => import('@/views/manage/students/index.vue'),
        name: 'Students',
        meta: { title: 'Students' }
      },
      {
        path: 'staffs',
        component: () => import('@/views/manage/staffs/index.vue'),
        name: 'Staffs',
        meta: { title: 'Lecturers' }
      },
      {
        path: 'admins',
        component: () => import('@/views/manage/admins/index.vue'),
        name: 'Admins',
        meta: { title: 'Admins' }
      }
    ]
  },
  {
    path: '/events',
    component: Layout,
    children: [
      {
        path: '',
        component: () => import('@/views/attendance/events.vue'),
        name: 'EventsAttendance',
        meta: { title: 'Events', icon: 'list' }
      }
    ]
  },

  {
    path: '/modules',
    component: Layout,
    redirect: '/modules',
    children: [
      {
        path: '',
        component: () => import('@/views/modules/index.vue'),
        name: 'Modules',
        meta: { title: 'Modules', icon: 'component' }
      },
      {
        path: ':moduleId',
        component: () => import('@/views/modules/detail.vue'),
        name: 'ModuleDetail',
        hidden: true,
        meta: { title: 'Module Detail', activeMenu: '/modules' }
      }
    ]
  },
  {
    path: '/classrooms',
    component: Layout,
    redirect: '/classrooms',
    children: [
      {
        path: '',
        component: () => import('@/views/classrooms/index.vue'),
        name: 'Classrooms',
        meta: { title: 'Classroom', icon: 'list' }
      }
    ]
  },
  {
    path: '/news',
    component: Layout,
    redirect: '/news',
    children: [
      {
        path: '',
        component: () => import('@/views/announcements/index.vue'),
        name: 'News',
        meta: { title: 'News', icon: 'message' }
      }
    ]
  },
  {
    path: '/announcements',
    component: Layout,
    redirect: '/announcements',
    children: [
      {
        path: '',
        component: () => import('@/views/announcements/admin.vue'),
        name: 'Announcements',
        meta: { title: 'Announcements', icon: 'message' }
      }
    ]
  },
  {
    path: '/appeal',
    component: Layout,
    redirect: '/appeal',
    children: [
      {
        path: '',
        component: () => import('@/views/appeal/index.vue'),
        name: 'AppealPage',
        meta: { title: 'Appeal', icon: 'list' }
      }
    ]
  },
  {
    path: '/leave',
    component: Layout,
    redirect: '/leave',
    children: [
      {
        path: '',
        component: () => import('@/views/leave/index.vue'),
        name: 'LeavePage',
        meta: { title: 'Leave', icon: 'list' }
      }
    ]
  }
];

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes: RouteRecordRaw[] = [];

/**
 * 创建路由
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_CONTEXT_PATH),
  routes: constantRoutes,
  // 刷新时，滚动条位置还原
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

export default router;

