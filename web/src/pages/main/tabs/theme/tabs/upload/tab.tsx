import { Block, BlockTitle, Button, List, ListItem, Fab, Preloader } from 'konsta/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchMyThemes, ThemeRecord } from '../../../../../../api/themes';
import { useAuthStore } from '../../../../../../state/auth.store';
import { RiAddFill, RiImageLine } from 'react-icons/ri';

export const UploadTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = async (pageToLoad = 1, append = false) => {
    if (!token) return;
    try {
      if (append) setLoadingMore(true);
      else setLoadingInitial(true);
      setError(null);
      const res = await fetchMyThemes(token, { page: pageToLoad, pageSize });
      setTotal(res.total);
      setPage(res.page);
      setThemes((prev) => (append ? dedupeById([...prev, ...res.themes]) : res.themes));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
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

  const hasMore = themes.length < total;
  const openDetail = (id: number) => navigate(`/my/themes/${id}`);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingMore && !loadingInitial && hasMore) {
          load(page + 1, true);
        }
      },
      { root: null, rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadingMore, loadingInitial, hasMore, page, token]);

  function dedupeById(items: ThemeRecord[]): ThemeRecord[] {
    const seen = new Set<number>();
    const out: ThemeRecord[] = [];
    for (const it of items) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
    return out;
  }

  return (
    <>
      <BlockTitle>{t('my-themes')}</BlockTitle>
      {error ? (
        <Block strong inset>
          {error}
        </Block>
      ) : null}

      <List strongIos inset>
        {loadingInitial ? <ListItem title={t('loading')} after={<Preloader />} /> : null}
        {themes.length === 0 && !loadingInitial ? <ListItem title={t('no-themes')} /> : null}
        {themes.map((th) => (
          <ListItem
            key={th.id}
            media={th.previewImageUrl ? <img src={th.previewImageUrl} alt="preview" width={44} height={44} /> : <RiImageLine size={28} />}
            title={th.title}
            subtitle={th.description || undefined}
            link
            onClick={() => openDetail(th.id)}
          />
        ))}
        {loadingMore ? <ListItem title={t('loading')} after={<Preloader />} /> : null}
        <div ref={sentinelRef} />
      </List>

      <Fab className="fixed right-4 bottom-24 z-10" icon={<RiAddFill />} onClick={() => navigate('/themes/new')} />
    </>
  );
};
