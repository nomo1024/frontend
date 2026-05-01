import { Settings as LayoutSettings } from '@ant-design/pro-layout';

const Settings: LayoutSettings & {
  pwa?: boolean;
  logo?: string;
  headerHeight?: number;
  splitMenus?: boolean;
} = {
  navTheme: 'dark',
  // 拂晓蓝
  primaryColor: '#1890ff',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '环境监测系统',
  pwa: false,
  logo: 'http://mms0.baidu.com/it/u=604189734,1143451865&fm=253&app=138&f=JPEG?w=250&h=250',
  iconfontUrl: '',
  headerHeight: 48,
  splitMenus: false,
};

export default Settings;
