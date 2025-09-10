import { Block, BlockTitle, Button, List, ListInput, Navbar, NavbarBackLink, Page, Link } from 'konsta/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerApi } from '../../api/auth';
import { useAuthStore } from '../../state/auth.store';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.trim().length >= 8 && nickname.trim().length > 0 && !loading;

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await registerApi(email.trim(), password, nickname.trim());
      setAuth(res.token, res.member);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Page>
        <Navbar title={t('register')} left={<NavbarBackLink text={t('back')} onClick={() => navigate(-1)} />} />

        <BlockTitle>{t('enter-info')}</BlockTitle>
        <List strongIos inset>
          <ListInput
            label={t('nickname')}
            type="text"
            placeholder={t('nickname')}
            value={nickname}
            onChange={(e) => setNickname((e.target as HTMLInputElement).value)}
            clearButton
          />
          <ListInput
            label={t('email')}
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            clearButton
          />
          <ListInput
            label={t('password')}
            type="password"
            placeholder={t('min-8-chars')}
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            clearButton
          />
        </List>

        <Block strong inset>
          <Button large disabled={!canSubmit} onClick={onSubmit}>
            {loading ? t('registering') : t('register')}
          </Button>
        </Block>

        {error ? (
          <Block strong inset>
            {error || t('register-failed')}
          </Block>
        ) : null}

        <Block inset>
          {t('already-have-account')} <Link onClick={() => navigate('/login')}>{t('login')}</Link>
        </Block>
      </Page>
    </>
  );
};

export default RegisterPage;
