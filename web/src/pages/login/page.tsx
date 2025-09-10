import { Block, BlockTitle, Button, List, ListInput, Navbar, NavbarBackLink, Page, Link } from 'konsta/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginApi } from '../../api/auth';
import { useAuthStore } from '../../state/auth.store';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await loginApi(email.trim(), password);
      setAuth(res.token, res.member);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Page>
        <Navbar title={t('login')} left={<NavbarBackLink text={t('back')} onClick={() => navigate(-1)} />} />

        <BlockTitle>{t('login-with-email')}</BlockTitle>
        <List strongIos inset>
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            clearButton
          />
        </List>

        <Block strong inset>
          <Button large disabled={!canSubmit} onClick={onSubmit}>
            {loading ? t('logging-in') : t('login')}
          </Button>
        </Block>

        {error ? (
          <Block strong inset>
            {error || t('login-failed')}
          </Block>
        ) : null}

        <Block inset>
          {t('dont-have-account')} <Link onClick={() => navigate('/register')}>{t('register')}</Link>
        </Block>
      </Page>
    </>
  );
};

export default LoginPage;
