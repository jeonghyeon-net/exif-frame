import { Block, BlockTitle, Button, List, ListItem, Fab, Preloader } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchMyThemes, ThemeRecord } from '../../../../../../api/themes';
import { useAuthStore } from '../../../../../../state/auth.store';
import { RiAddFill } from 'react-icons/ri';

export const UploadTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchMyThemes(token, { page: 1, pageSize: 50 });
      setThemes(res.themes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <>
        <Block strong inset>
          {t('login-required')}
        </Block>
        <Block inset>
          <Button onClick={() => navigate('/login')}>{t('login')}</Button>
        </Block>
      </>
    );
  }

  const openDetail = (id: number) => navigate(`/themes/${id}`);

  return (
    <>
      <BlockTitle>{t('my-themes')}</BlockTitle>

      {loading ? (
        <Block strong inset>
          <Preloader />
        </Block>
      ) : null}

      {error ? (
        <Block strong inset>
          {error}
        </Block>
      ) : null}

      <List strongIos inset>
        {themes.length === 0 && !loading ? <ListItem title={t('no-themes')} /> : null}
        {themes.map((th) => (
          <ListItem
            key={th.id}
            media={th.previewImageUrl ? <img src={th.previewImageUrl} alt="preview" width={44} height={44} /> : undefined}
            title={th.title}
            subtitle={th.description || undefined}
            link
            onClick={() => openDetail(th.id)}
          />
        ))}
      </List>

      <Fab className="fixed right-4 bottom-24 z-10" icon={<RiAddFill />} onClick={() => navigate('/themes/new')} />
    </>
  );
};
