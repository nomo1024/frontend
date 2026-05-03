import { Space } from 'antd';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import AvatarDropdown from "./AvatarDropdown";
export type SiderTheme = 'light' | 'dark';

const GlobalHeaderRight: React.FC = () => {
  const { initialState } = useModel('@@initialState');

  if (!initialState || !initialState.settings) {
    return null;
  }

  return (
    <Space className={styles.right}>
      <AvatarDropdown menu />
    </Space>
  );
};

export default GlobalHeaderRight;
