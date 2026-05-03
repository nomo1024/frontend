import React, {useEffect, useRef, useState} from 'react';
import type {ActionType, ProColumns} from '@ant-design/pro-table';
import ProTable, { ProFormInstance } from '@ant-design/pro-table';
import {Button, Dropdown, Menu, message, Space} from 'antd';
import {deleteUser, searchUsers, updateUser} from "@/services/ant-design-pro/api";
import {ArrowDownOutlined, ArrowUpOutlined, DownOutlined} from '@ant-design/icons';

export default () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [sortField, setSortField] = useState<'id' | 'userAccount' | 'createTime'>('id');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('ascend');
  const [searchId, setSearchId] = useState<string>('');

  const isIdSearching = !!searchId;

  const columns: ProColumns<API.CurrentUser>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      editable: false,
      search: {
        fieldProps: {
          onChange: (e: any) => setSearchId(e.target.value),
        },
      },
    },
    {
      title: '用户账户',
      dataIndex: 'userAccount',
      copyable: true,
      search: {
        fieldProps: {
          disabled: isIdSearching,
        },
      },
    },
    {
      title: '电话',
      dataIndex: 'phone',
      copyable: true,
      search: {
        fieldProps: {
          disabled: isIdSearching,
        },
      },
    },
    {
      title: '邮件',
      dataIndex: 'email',
      copyable: true,
      search: {
        fieldProps: {
          disabled: isIdSearching,
        },
      },
    },
    {
      title: '状态',
      dataIndex: 'userStatus',
      search: {
        fieldProps: {
          disabled: isIdSearching,
        },
      },
    },
    {
      title: '角色',
      dataIndex: 'userRole',
      valueType: 'select',
      valueEnum: {
        0: {text: '普通用户', status: 'Default'},
        1: {text: '管理员', status: 'Success'},
      },
      search: {
        fieldProps: {
          disabled: isIdSearching,
        },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: {
        fieldProps: {
          disabled: isIdSearching,
        },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      render: (text, record, _, action) => [
        <a
          key="editable"
          onClick={() => {
            action?.startEditable?.(record.id);
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          onClick={async () => {
          await deleteUser({id: record.id});
          message.success('删除成功');
          action?.reload();
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  useEffect(() => {
    actionRef.current?.reload();
  }, [sortField, sortOrder]);

  return (
    <ProTable<API.CurrentUser>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params = {}, sort, filter) => {
        const queryRequest: API.UserQueryRequest = {};
        if (params.id && String(params.id).trim()) queryRequest.id = Number(params.id);
        if (params.userAccount && String(params.userAccount).trim()) queryRequest.userAccount = params.userAccount;
        if (params.phone && String(params.phone).trim()) queryRequest.phone = params.phone;
        if (params.email && String(params.email).trim()) queryRequest.email = params.email;
        if (params.userRole !== undefined && params.userRole !== '') queryRequest.userRole = Number(params.userRole);
        if (params.userStatus !== undefined && params.userStatus !== '') queryRequest.userStatus = params.userStatus;
        if (params.createTime && Array.isArray(params.createTime) && params.createTime.length === 2) {
          queryRequest.createTimeFrom = params.createTime[0];
          queryRequest.createTimeTo = params.createTime[1];
        }
        console.log('发送请求:', JSON.stringify(queryRequest));
        const userList = await searchUsers(queryRequest);
        const list = userList || [];
        const hasSearchParams = Object.keys(queryRequest).length > 0;
        if (hasSearchParams && list.length > 0) {
          message.success('查询成功');
        }
        const sortedList = list.sort((a, b) => {
          const fieldA = a[sortField];
          const fieldB = b[sortField];
          if (sortOrder === 'ascend') {
            return fieldA > fieldB ? 1 : -1;
          } else {
            return fieldA < fieldB ? 1 : -1;
          }
        });
        return {
          data: sortedList,
          total: sortedList.length,
        }
      }}
      options={{
        density: false,
        reload: true,
        setting: true,
      }}
      toolBarRender={() => [
        <Space key="sortControls">
          <Dropdown
            trigger={['hover']}
            overlay={
              <Menu
                onClick={(e) => {
                  setSortField(e.key as any);
                }}
              >
                <Menu.Item key="id" style={{
                  backgroundColor: sortField === 'id' ? '#1890ff' : 'transparent',
                  color: sortField === 'id' ? '#fff' : 'inherit'
                }}>按ID</Menu.Item>
                <Menu.Item key="userAccount" style={{
                  backgroundColor: sortField === 'userAccount' ? '#1890ff' : 'transparent',
                  color: sortField === 'userAccount' ? '#fff' : 'inherit'
                }}>按账户</Menu.Item>
                <Menu.Item key="createTime" style={{
                  backgroundColor: sortField === 'createTime' ? '#1890ff' : 'transparent',
                  color: sortField === 'createTime' ? '#fff' : 'inherit'
                }}>按创建时间</Menu.Item>
              </Menu>
            }
            mouseEnterDelay={0.3}
            mouseLeaveDelay={0.1}
          >
            <Button type="primary">
              排序方式 <DownOutlined/>
            </Button>
          </Dropdown>
          <Button
            onClick={() => setSortOrder(sortOrder === 'ascend' ? 'descend' : 'ascend')}
            style={{
              padding: '4px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowUpOutlined
              style={{
                fontSize: 14,
                color: sortOrder === 'ascend' ? '#1890ff' : 'black',
                transform: 'translateX(-3px)',
                lineHeight: 1,
                marginBottom: -2,
              }}
            />
            <ArrowDownOutlined
              style={{
                fontSize: 14,
                color: sortOrder === 'descend' ? '#1890ff' : 'black',
                transform: 'translateX(3px)',
                lineHeight: 1,
                marginTop: -2,
              }}
            />
          </Button>
        </Space>,
      ]}
      editable={{
        type: 'multiple',
        onSave: async (rowKey, data) => {
          const { id, createTime, ...editableFields } = data;
          const hasChanges = Object.keys(editableFields).some(key =>
            editableFields[key] !== undefined && editableFields[key] !== ''
          );
          if (!hasChanges) {
            message.info('未修改任何内容');
            return;
          }
          await updateUser(data);
          message.success('更新成功');
          actionRef.current?.reload();
        },
        actionRender: (record, config, defaultDoms) => {
          return [defaultDoms.save, defaultDoms.cancel];
        },
      }}
      columnsState={{
        persistenceKey: 'pro-table-singe-demos',
        persistenceType: 'localStorage',
      }}
      rowKey="id"
      search={{
        labelWidth: 'auto',
      }}
      form={{
        syncToUrl: (values, type) => {
          if (type === 'post') {
            return {
              ...values,
              created_at: [values.startTime, values.endTime],
            };
          }
          return values;
        },
        onValuesChange: (changedValues: any, allValues: any) => {
          if ('id' in changedValues) {
            setSearchId(changedValues.id || '');
          }
        },
      }}
      pagination={{
        pageSize: 5,
      }}
      dateFormatter="string"
      headerTitle="用户管理"
    />
  );
};
