import { Block, BlockTitle, List, ListItem, Preloader, Searchbar } from 'konsta/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { searchThemes, ThemeRecord } from '../../../../../../api/themes';
import { RiImageLine } from 'react-icons/ri';
import { useDownloadsStore, isModified } from '../../../../../../state/downloads.store';

export const SearchTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const downloads = useDownloadsStore((s) => s.entries);
  const [query, setQuery] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = async (q: string, pageToLoad = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoadingInitial(true);
      setError(null);
      const res = await searchThemes({ title: q || undefined, page: pageToLoad, pageSize, sort: 'downloadCount', order: 'desc' });
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
    // initial
    load('');
  }, []);

  // Simple debounce
  useEffect(() => {
    const h = setTimeout(() => {
      // reset to first page on new query
      load(query.trim(), 1, false);
    }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasMore = themes.length < total;

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingMore && !loadingInitial && hasMore) {
          load(query.trim(), page + 1, true);
        }
      },
      { root: null, rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadingMore, loadingInitial, hasMore, page, query]);

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
      <Searchbar value={query} onChange={(e) => setQuery((e.target as HTMLInputElement).value)} placeholder={t('search')} />

      {error ? (
        <Block strong inset>
          {error}
        </Block>
      ) : null}

      <BlockTitle>{t('search-results')}</BlockTitle>
      <List strongIos inset>
        {loadingInitial ? <ListItem title={t('loading')} after={<Preloader />} /> : null}
        {themes.length === 0 && !loadingInitial ? <ListItem title={t('no-results')} /> : null}
        {themes.map((th) => {
          const entry = downloads[th.id];
          const downloaded = !!entry;
          const modified = entry ? isModified(entry) : false;
          const status = downloaded ? (modified ? t('downloaded-modified') : t('downloaded')) : undefined;
          return (
            <ListItem
              key={th.id}
            media={th.previewImageUrl ? <img src={th.previewImageUrl} alt="preview" width={44} height={44} /> : <RiImageLine size={28} />}
              title={th.title}
              subtitle={th.description || undefined}
              after={status}
              link
              onClick={() => navigate(`/themes/${th.id}`)}
            />
          );
        })}
        {loadingMore ? <ListItem title={t('loading')} after={<Preloader />} /> : null}
        <div ref={sentinelRef} />
      </List>
    </>
  );
};
