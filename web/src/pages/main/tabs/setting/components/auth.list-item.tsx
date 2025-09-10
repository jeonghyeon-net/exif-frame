import { Button, ListItem } from 'konsta/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../../state/auth.store';
import { RiUser3Fill } from 'react-icons/ri';
import { TbLogin2 } from 'react-icons/tb';

const AuthListItem = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, member, clearAuth } = useAuthStore((s) => ({ token: s.token, member: s.member, clearAuth: s.clearAuth }));

  if (token && member) {
    return (
      <ListItem
        media={<RiUser3Fill size={26} />}
        title={t('my-info')}
        subtitle={`${member.nickname} · ${member.email}`}
        after={
          <Button small clear onClick={() => clearAuth()}>
            {t('logout')}
          </Button>
        }
      />
    );
  }

  return <ListItem link media={<TbLogin2 size={26} />} title={t('register-or-login')} onClick={() => navigate('/register')} />;
};

export default AuthListItem;
