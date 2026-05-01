import React, {useEffect, useRef, useState} from 'react';
import type {ActionType, ProColumns} from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import {Button, Dropdown, Menu, Space} from 'antd';
import {deleteUser, searchUsers, updateUser} from "@/services/ant-design-pro/api";
import {ArrowDownOutlined, ArrowUpOutlined, DownOutlined} from '@ant-design/icons';

const columns: ProColumns<API.CurrentUser>[] = [
  {
    dataIndex: 'id',
    valueType: 'indexBorder',
    width: 48,
  },
  {
    title: '用户账户',
    dataIndex: 'userAccount',
    copyable: true,
  },
  {
    title: 'ID',
    dataIndex: 'id',
  },
  {
    title: '电话',
    dataIndex: 'phone',
    copyable: true,
  },
  {
    title: '邮件',
    dataIndex: 'email',
    copyable: true,
  },
  {
    title: '状态',
    dataIndex: 'userStatus',
  },
  {
    title: '角色',
    dataIndex: 'userRole',
    valueType: 'select',
    valueEnum: {
      0: {text: '普通用户', status: 'Default'},
      1: {
        text: '管理员',
        status: 'Success',
      },
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    valueType: 'dateTime',
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
          action?.reload();
        }}
      >
        删除
      </a>,
    ],
  },
];

export default () => {
  const actionRef = useRef<ActionType>();
  const [sortField, setSortField] = useState<'id' | 'userAccount' | 'createTime'>('id');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('ascend');

  useEffect(() => {
    actionRef.current?.reload();
  }, [sortField, sortOrder]);

  return (
    <ProTable<API.CurrentUser>
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params = {}, sort, filter) => {
        console.log(sort, filter);
        const userList = await searchUsers({params});
        const sortedList = (userList || []).sort((a, b) => {
          const fieldA = a[sortField];
          const fieldB = b[sortField];
          if (sortOrder === 'ascend') {
            return fieldA > fieldB ? 1 : -1;
          } else {
            return fieldA < fieldB ? 1 : -1;
          }
        });
        return {
          data: sortedList
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
                <Menu.Item key="id">按ID</Menu.Item>
                <Menu.Item key="userAccount">按账户</Menu.Item>
                <Menu.Item key="createTime">按创建时间</Menu.Item>
              </Menu>
            }
            onVisibleChange={(visible) => {
              if (visible) {
                console.log('Menu visible');
              }
            }}
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
          await updateUser(data);
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
          if (type === 'get') {
            return {
              ...values,
              created_at: [values.startTime, values.endTime],
            };
          }
          return values;
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
