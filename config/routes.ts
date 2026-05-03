export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user',
        routes: [
          {
            name: '登录',
            path: '/user/login',
            component: './user/Login',
          },
          {
            name: '注册',
            path: '/user/register',
            component: './user/Register',
          },
        ],
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '用户管理',
    icon: 'user',
    path: '/admin/user-manage',
    component: './Admin/UserManage',
    access: 'canAdmin',
  },
  {
    name: 'GPS监测',
    icon: 'environment',
    path: '/sensor/gps',
    component: './Sensor/gps',
  },
  {
    name: '湿度监测',
    icon: 'experiment',
    path: '/sensor/humidity',
    component: './Sensor/humidity',
  },
  {
    name: '光照监测',
    icon: 'bulb',
    path: '/sensor/light',
    component: './Sensor/light',
  },
  {
    name: '气压监测',
    icon: 'dashboard',
    path: '/sensor/pressure',
    component: './Sensor/pressure',
  },
  {
    name: '温度监测',
    icon: 'fire',
    path: '/sensor/temperature',
    component: './Sensor/temperature',
  },
  {
    name: '个人中心',
    path: '/account/center',
    component: './Center',
    hideInMenu: true,
  },
  {
    component: './404',
  },

];
