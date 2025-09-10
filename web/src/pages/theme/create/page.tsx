import { Block, BlockTitle, Button, List, ListInput, Navbar, NavbarBackLink, Page } from 'konsta/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createTheme } from '../../../api/themes';
import { useAuthStore } from '../../../state/auth.store';

const ThemeCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [svg, setSvg] = useState('');
  const [assets, setAssets] = useState('');
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!token || !title.trim() || !description.trim() || !svg.trim() || !assets.trim()) return;
    try {
      setCreating(true);
      setError(null);
      await createTheme(token, { title: title.trim(), description: description.trim(), svg: svg.trim(), assets: assets.trim() });
      navigate(-1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  if (!token) {
    return (
      <Page>
        <Navbar title={t('create-theme')} left={<NavbarBackLink text={t('back')} onClick={() => navigate(-1)} />} />
        <Block strong inset>
          {t('login-required')}
        </Block>
        <Block inset>
          <Button onClick={() => navigate('/login')}>{t('login')}</Button>
        </Block>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar title={t('create-theme')} left={<NavbarBackLink text={t('back')} onClick={() => navigate(-1)} />} />

      {error ? (
        <Block strong inset>
          {error}
        </Block>
      ) : null}

      <BlockTitle>{t('title')}</BlockTitle>
      <List strongIos inset>
        <ListInput type="text" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} />
      </List>

      <BlockTitle>{t('description')}</BlockTitle>
      <List strongIos inset>
        <ListInput type="text" value={description} onChange={(e) => setDescription((e.target as HTMLInputElement).value)} />
      </List>

      <BlockTitle>{t('svg')}</BlockTitle>
      <div className="p-4 mt-2">
        <textarea
          value={svg}
          onChange={(e) => setSvg((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste or edit SVG here"
          wrap="off"
          className="w-full h-[30vh] block resize-vertical p-3 font-mono text-xs overflow-x-auto rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-700"
        />
      </div>

      <BlockTitle>{t('assets')}</BlockTitle>
      <div className="p-4 mt-2">
        <textarea
          value={assets}
          onChange={(e) => {
            const v = (e.target as HTMLTextAreaElement).value;
            setAssets(v);
            try {
              JSON.parse(v);
              setAssetsError(null);
            } catch {
              setAssetsError(t('assets-invalid-json'));
            }
          }}
          placeholder="Assets JSON"
          wrap="off"
          className="w-full h-[30vh] block resize-vertical p-3 font-mono text-xs overflow-x-auto rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-700"
        />
        {assetsError ? <div>{assetsError}</div> : null}
      </div>

      <Block strong inset>
        <Button large onClick={create} disabled={creating || !title.trim() || !description.trim() || !svg.trim() || !assets.trim() || !!assetsError}>
          {creating ? t('creating') : t('create')}
        </Button>
      </Block>
    </Page>
  );
};

export default ThemeCreatePage;
