import {GithubOutlined} from '@ant-design/icons';
import {DefaultFooter} from '@ant-design/pro-layout';

const Footer: React.FC = () => {
  const defaultMessage = '李玉城 出品';
  const currentYear = new Date().getFullYear();
  return (
    <DefaultFooter
      copyright={`${currentYear} ${defaultMessage}`}
      links={[


        {
          key: 'github',
          title: <><GithubOutlined/> 项目 GitHub</>,
          href: 'https://github.com/nomo1024',
          blankTarget: true,
        },

      ]}
    />
  );
};

export default Footer;
