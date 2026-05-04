import React, {useEffect, useRef, useState} from 'react';
import {Avatar, Button, Card, Col, Descriptions, message, Row, Select} from 'antd';
import {ProForm, ProFormInstance, ProFormText} from '@ant-design/pro-form';
import {useModel} from 'umi';
import {updateUser} from '@/services/ant-design-pro/api';
import moment from 'moment';

const Center: React.FC = () => {
  const {initialState, setInitialState} = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [editMode, setEditMode] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const formRef = useRef<ProFormInstance>();

  useEffect(() => {
    if (!currentUser) {
      message.error('请先登录');
    }
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  const handleStatusChange = async (newStatus: number) => {
    try {
      setStatusChanging(true);
      const updatedUser = {
        id: currentUser.id,
        userAccount: currentUser.userAccount,
        phone: currentUser.phone,
        email: currentUser.email,
        userRole: currentUser.userRole,
        userStatus: Number(newStatus),
        createTime: currentUser.createTime,
      };
      await updateUser(updatedUser);
      await setInitialState((s) => ({ ...s, currentUser: updatedUser }));
      message.success('状态更新成功');
    } catch (error) {
      console.error('状态更新失败:', error);
    } finally {
      setStatusChanging(false);
    }
  };

  const handleFinish = async (values: Partial<API.CurrentUser>) => {
    try {
      const changedValues: Partial<API.CurrentUser> = {};

      if (values.userAccount && values.userAccount !== currentUser.userAccount) {
        changedValues.userAccount = values.userAccount;
      }
      if (values.phone && values.phone !== currentUser.phone) {
        changedValues.phone = values.phone;
      }
      if (values.email && values.email !== currentUser.email) {
        changedValues.email = values.email;
      }
      if (values.userPassword) {
        changedValues.userPassword = values.userPassword;
      }

      if (Object.keys(changedValues).length === 0) {
        message.info('没有任何修改');
        return;
      }

      const updatedUser = {
        id: currentUser.id,
        ...currentUser,
        ...changedValues,
      };
      await updateUser(updatedUser);
      message.success('更新成功');

      await setInitialState((s) => ({
        ...s,
        currentUser: updatedUser,
      }));

      setEditMode(false);
    } catch (error) {
      // 错误信息已由全局拦截器提示，此处不再重复提示
    }
  };

  const handleCancel = () => {
    formRef.current?.resetFields();
    setEditMode(false);
  };

  const avatarLetter = currentUser.userAccount ? currentUser.userAccount.charAt(0).toUpperCase() : '';

  return (
    <div style={{padding: '24px', background: '#f0f2f5', minHeight: '100vh'}}>
      <Card title="个人中心" bordered={false}>
        <div style={{textAlign: 'center', marginBottom: 32}}>
          <Avatar size={80} style={{backgroundColor: '#1890ff', color: '#fff', fontSize: 36}}>
            {avatarLetter}
          </Avatar>
          <h2 style={{marginTop: 16}}>{currentUser.userAccount}</h2>
        </div>

        <Descriptions title="基本信息" bordered column={2}>
          <Descriptions.Item label="ID">{currentUser.id}</Descriptions.Item>
          <Descriptions.Item label="角色">{currentUser.userRole === 1 ? '管理员' : '普通用户'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Select
              value={currentUser.userStatus}
              onChange={handleStatusChange}
              loading={statusChanging}
              style={{ width: 120 }}
              options={[
                { value: 0, label: '离线' },
                { value: 1, label: '在线' },
                { value: 2, label: '隐身' },
                { value: 3, label: '忙碌' },
              ]}
            />
          </Descriptions.Item>
          <Descriptions.Item
            label="创建时间">{currentUser.createTime ? moment(currentUser.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        </Descriptions>

        <div style={{marginTop: 32}}>
          <h3 style={{marginBottom: 16}}>修改信息</h3>
          <ProForm
            formRef={formRef}
            submitter={{
              render: (props, doms) => {
                if (!editMode) {
                  return (
                    <Button type="primary" onClick={() => setEditMode(true)}>
                      编辑信息
                    </Button>
                  );
                }
                return (
                  <Row gutter={16}>
                    <Col>
                      <Button type="primary" onClick={() => props.form?.submit()}>
                        保存
                      </Button>
                    </Col>
                    <Col>
                      <Button onClick={handleCancel}>取消</Button>
                    </Col>
                  </Row>
                );
              },
            }}
            onFinish={handleFinish}
            initialValues={{
              userAccount: currentUser.userAccount,
              phone: currentUser.phone,
              email: currentUser.email,
              userPassword: '',
            }}
          >
            <ProFormText
              name="userAccount"
              label="用户名"
              fieldProps={{disabled: !editMode}}
              rules={[
                {
                  required: true,
                  message: '用户名是必填项',
                },
                {
                  validator: async (_, value) => {

                    return Promise.resolve();
                  },
                },
              ]}
            />
            <ProFormText.Password
              name="userPassword"
              label="密码"
              fieldProps={{disabled: !editMode}}
              rules={[
                {
                  min: 8,
                  type: 'string',
                  message: '密码长度不能小于 8 位',
                },
              ]}
              placeholder={editMode ? '输入新密码（不修改请留空）' : ''}
            />
            <ProFormText
              name="phone"
              label="手机号"
              fieldProps={{disabled: !editMode}}
              rules={[
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入正确的手机号',
                },
                {},
              ]}
            />
            <ProFormText
              name="email"
              label="邮箱"
              fieldProps={{disabled: !editMode}}
              rules={[
                {
                  type: 'email',
                  message: '请输入正确的邮箱地址',
                },
                {
                  validator: async (_, value) => {

                    return Promise.resolve();
                  },
                },
              ]}
            />
          </ProForm>
        </div>
      </Card>
    </div>
  );
};

export default Center;
