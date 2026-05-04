import React, { useEffect, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable, { ProFormInstance } from '@ant-design/pro-table';
import { Button, Dropdown, Menu, message, Space } from 'antd';
import { deleteUser, searchUsers, updateUser } from '@/services/ant-design-pro/api';
import { ArrowDownOutlined, ArrowUpOutlined, DownOutlined } from '@ant-design/icons';

export default () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();

  const [sortField, setSortField] = useState<'id' | 'userAccount' | 'createTime'>('id');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('ascend');

  // 响应式监听 ID 搜索框的值，用于动态禁用其他输入框
  const [idSearchValue, setIdSearchValue] = useState<string>('');
  const isIdSearching = !!idSearchValue; // 只要有内容就禁用其他框

  const columns: ProColumns<API.CurrentUser>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      editable: false,
      search: {
        fieldProps: {
          type: 'number',
          min: 1,
          precision: 0,
          onChange: (e) => {
            // 同步 ID 输入框的值到状态
            setIdSearchValue(e.target.value || '');
          },
        },
      },
    },
    {
      title: '用户账户',
      dataIndex: 'userAccount',
      copyable: true,
      search: {
        fieldProps: () => ({
          disabled: isIdSearching,
        }),
      },
    },
    {
      title: '电话',
      dataIndex: 'phone',
      copyable: true,
      search: {
        fieldProps: () => ({
          disabled: isIdSearching,
        }),
      },
    },
    {
      title: '邮件',
      dataIndex: 'email',
      copyable: true,
      search: {
        fieldProps: () => ({
          disabled: isIdSearching,
        }),
      },
    },
    {
      title: '状态',
      dataIndex: 'userStatus',
      valueType: 'select',
      valueEnum: {
        0: { text: '离线', status: 'Default' },
        1: { text: '在线', status: 'Success' },
        2: { text: '隐身', status: 'Warning' },
        3: { text: '忙碌', status: 'Error' },
      },
      search: {
        fieldProps: () => ({
          disabled: isIdSearching,
        }),
      },
    },
    {
      title: '角色',
      dataIndex: 'userRole',
      valueType: 'select',
      valueEnum: {
        0: { text: '普通用户', status: 'Default' },
        1: { text: '管理员', status: 'Success' },
      },
      search: {
        fieldProps: () => ({
          disabled: isIdSearching,
        }),
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      render: (val) => val ? new Date(val as string).toLocaleString() : '-',
      hideInSearch: true,
    },
    {
      title: '开始时间',
      dataIndex: 'createTimeFrom',
      valueType: 'dateTime',
      hideInTable: true,
      search: {
        fieldProps: () => ({
          disabled: isIdSearching,
          placeholder: '开始时间',
        }),
      },
    },
    {
      title: '结束时间',
      dataIndex: 'createTimeTo',
      valueType: 'dateTime',
      hideInTable: true,
      search: {
        fieldProps: () => ({
          disabled: isIdSearching,
          placeholder: '结束时间',
        }),
      },
    },
    {
      title: '操作',
      valueType: 'option',
      render: (text, record, _, action) => [
        <a key="editable" onClick={() => action?.startEditable?.(record.id)}>编辑</a>,
        <a key="delete" onClick={async () => {
          await deleteUser({ id: record.id });
          message.success('删除成功');
          actionRef.current?.reload();
        }}>删除</a>,
      ],
    },
  ];

  // 排序字段或顺序变化时刷新表格
  useEffect(() => {
    actionRef.current?.reload();
  }, [sortField, sortOrder]);

  return (
    <ProTable<API.CurrentUser>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params = {}) => {
        const queryRequest: API.UserQueryRequest = {};

        // ID 参数校验
        if (params.id !== undefined && params.id !== null && String(params.id).trim() !== '') {
          const idStr = String(params.id).trim();
          if (!/^[1-9]\d*$/.test(idStr)) {
            message.warning('请输入 ≥ 1 的整数 ID');
            return { data: [], total: 0 };
          }
          queryRequest.id = Number(idStr);
        }

        // 其他参数（当ID有值时，这些参数不会被加入查询，但为了严谨仍然判断）
        if (params.userAccount?.trim()) queryRequest.userAccount = params.userAccount;
        if (params.phone?.trim()) queryRequest.phone = params.phone;
        if (params.email?.trim()) queryRequest.email = params.email;
        if (params.userRole !== undefined && params.userRole !== '') queryRequest.userRole = Number(params.userRole);
        if (params.userStatus !== undefined && params.userStatus !== '') queryRequest.userStatus = Number(params.userStatus);
        if (params.createTimeFrom) queryRequest.createTimeFrom = params.createTimeFrom;
        if (params.createTimeTo) queryRequest.createTimeTo = params.createTimeTo;

        const userList = await searchUsers(queryRequest);
        const list = userList || [];
        const hasSearch = Object.keys(queryRequest).length > 0;
        if (hasSearch && list.length >= 0) message.success(`查询到 ${list.length} 条数据`);

        // 前端排序（根据选择的字段和顺序）
        const sorted = [...list].sort((a, b) => {
          const fa = a[sortField];
          const fb = b[sortField];
          return sortOrder === 'ascend' ? (fa > fb ? 1 : -1) : (fa < fb ? 1 : -1);
        });

        return { data: sorted, total: sorted.length };
      }}
      options={{ density: false, reload: true, setting: true }}
      toolBarRender={() => [
        <Space key="sort">
          <Dropdown trigger={['hover']} overlay={
            <Menu onClick={(e) => setSortField(e.key as any)}>
              <Menu.Item key="id" style={{ backgroundColor: sortField === 'id' ? '#1890ff' : '', color: sortField === 'id' ? '#fff' : '' }}>按ID</Menu.Item>
              <Menu.Item key="userAccount" style={{ backgroundColor: sortField === 'userAccount' ? '#1890ff' : '', color: sortField === 'userAccount' ? '#fff' : '' }}>按账户</Menu.Item>
              <Menu.Item key="createTime" style={{ backgroundColor: sortField === 'createTime' ? '#1890ff' : '', color: sortField === 'createTime' ? '#fff' : '' }}>按创建时间</Menu.Item>
            </Menu>
          }>
            <Button type="primary">排序方式 <DownOutlined /></Button>
          </Dropdown>
          <Button onClick={() => setSortOrder(sortOrder === 'ascend' ? 'descend' : 'ascend')} style={{ padding: '4px 8px', flexDirection: 'column' }}>
            <ArrowUpOutlined style={{ color: sortOrder === 'ascend' ? '#1890ff' : '#000' }} />
            <ArrowDownOutlined style={{ color: sortOrder === 'descend' ? '#1890ff' : '#000' }} />
          </Button>
        </Space>,
      ]}
      editable={{
        type: 'multiple',
        onSave: async (rowKey, data) => {
          const { id, createTime, ...rest } = data;
          const hasChange = Object.values(rest).some(v => v !== undefined && v !== '');
          if (!hasChange) { message.info('未修改内容'); return; }
          await updateUser(data);
          message.success('更新成功');
          actionRef.current?.reload();
        },
        actionRender: (r, c, doms) => [doms.save, doms.cancel],
      }}
      columnsState={{ persistenceKey: 'user-manager-table', persistenceType: 'localStorage' }}
      rowKey="id"
      search={{ labelWidth: 'auto', syncToUrl: false }}
      form={{
        formRef: formRef,
        syncToUrl: (v) => v,
        onReset: () => {
          setIdSearchValue('');
          formRef.current?.setFieldsValue({ id: undefined });
        },
      }}
      pagination={false}
      dateFormatter="string"
      headerTitle="用户管理"
    />
  );
};
