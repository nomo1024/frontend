import {LockOutlined, UserOutlined,} from '@ant-design/icons';
import {Alert, message, Tabs} from 'antd';
import React, {useState} from 'react';
import {LoginForm, ProFormCheckbox, ProFormText} from '@ant-design/pro-form';
import {history, useModel} from 'umi';
import {SYSTEM_LOGO} from '@/constants';
import {login} from '@/services/ant-design-pro/api';
import styles from './index.less';
import {Link} from "@umijs/preset-dumi/lib/theme";
import Footer from "@/components/Footer";

const LoginMessage: React.FC<{
  content: string;
}> = ({content}) => (
  <Alert
    style={{
      marginBottom: 24,
    }}
    message={content}
    type="error"
    showIcon
  />
);

const Login: React.FC = () => {
  const [userLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<string>('account');
  const {initialState, setInitialState} = useModel('@@initialState');

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();

    if (userInfo) {
      await setInitialState((s) => ({...s, currentUser: userInfo}));
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // 登录
      const user = await login({...values, type});

      if (user) {
        const defaultLoginSuccessMessage = '登录成功！';
        message.success(defaultLoginSuccessMessage);
        await fetchUserInfo();
        /** 根据用户身份跳转 */

        if (!history) return;
        const {query} = history.location;
        const {redirect} = query as {
          redirect: string;
        };

        // 检查 redirect 路径是否与用户角色匹配
        const isAdminPath = redirect?.startsWith('/admin');
        const isAdminUser = user.userRole === 1;

        // 普通用户尝试访问管理员页面时跳转到其默认首页
        if (redirect && (!isAdminPath || isAdminUser)) {
          history.push(redirect);
        } else if (isAdminUser) {
          history.push('/admin/user-manage');
        } else {
          history.push('/sensor/gps');
        }
        return;
      } else {
        message.error('用户名或密码错误');
      }
    } catch (error) {
      const defaultLoginFailureMessage = '登录失败，请重试！';
      message.error(defaultLoginFailureMessage);
    }
  };

  const {status, type: loginType} = userLoginState;
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <LoginForm
          logo={<img alt="logo" src={SYSTEM_LOGO}/>}
          title="环境监测系统"
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          <Tabs activeKey={type} onChange={setType}>
            <Tabs.TabPane key="account" tab={'用户登录'}/>
          </Tabs>
          {status === 'error' && loginType === 'account' && (
            <LoginMessage content={'账号或密码错误'}/>
          )}
          {type === 'account' && (
            <>
              <div className={styles.fieldLabel}>账号</div>
              <ProFormText
                name="userAccount"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={styles.prefixIcon}/>,
                }}
                placeholder="请输入账号"
                rules={[
                  {
                    required: true,
                    message: '账号是必填项！',
                  },
                ]}
              />
              <div className={styles.fieldLabel}>密码</div>
              <ProFormText.Password
                name="userPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon}/>,
                }}
                placeholder="请输入密码"
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                  {
                    min: 8,
                    type: 'string',
                    message: '长度不能小于 8',
                  },
                ]}
              />
            </>
          )}
          <div className={styles.actions}>
            <div className={styles.leftAction}>
              <ProFormCheckbox noStyle name="autoLogin">
                自动登录
              </ProFormCheckbox>
            </div>
            <div className={styles.rightAction}>
              <Link to="/user/register" className={styles.registerLink}>用户注册</Link>
            </div>
          </div>
        </LoginForm>
      </div>
      <Footer/>
    </div>
  );
};

export default Login;
