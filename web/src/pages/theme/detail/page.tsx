import { Block, BlockTitle, Button, List, ListInput, ListItem, Navbar, NavbarBackLink, Page, Toast, Preloader } from 'konsta/react';
import { RiImageLine } from 'react-icons/ri';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteTheme, fetchTheme, ThemeRecord, updateTheme, uploadThemePreview } from '../../../api/themes';
import { useAuthStore } from '../../../state/auth.store';
 

const ThemeDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);
  const token = useAuthStore((s) => s.token);
  const me = useAuthStore((s) => s.member);

  const [theme, setTheme] = useState<ThemeRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [svg, setSvg] = useState('');
  const [assets, setAssets] = useState('');
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [uploadedToast, setUploadedToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const isOwner = !!(theme && me && theme.ownerMemberId === me.id);
  

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTheme(id);
      setTheme(res.theme);
      setTitle(res.theme.title);
      setDescription(res.theme.description ?? '');
      setSvg(res.theme.svg ?? '');
      setAssets(res.theme.assets ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    if (!token || !isOwner || !theme) return;
    try {
      setSaving(true);
      if (assets) {
        try {
          JSON.parse(assets);
        } catch {
          setAssetsError(t('assets-invalid-json'));
          return;
        }
      }
      await updateTheme(token, theme.id, { title, description, svg, assets });
      await load();
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onPickPreview = () => {
    if (!isOwner) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token || !theme) return;
    try {
      setUploading(true);
      await uploadThemePreview(token, theme.id, file);
      await load();
      setUploadedToast(true);
      setTimeout(() => setUploadedToast(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload preview');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async () => {
    if (!token || !isOwner || !theme) return;
    try {
      setDeleting(true);
      await deleteTheme(token, theme.id);
      navigate(-1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/jpeg" onChange={onFileChange} hidden />
      <Page>
        <Navbar title={t('my-themes')} left={<NavbarBackLink text={t('back')} onClick={() => navigate(-1)} />} />
        <Toast opened={savedToast}>{t('saved')}</Toast>
        <Toast opened={uploadedToast}>{t('preview-uploaded')}</Toast>

        {error ? (
          <Block strong inset>
            {error}
          </Block>
        ) : null}

        {theme ? (
          <>
            {/* Edit-only content: download controls removed */}

            <BlockTitle>{t('title')}</BlockTitle>
            <List strongIos inset>
              <ListInput type="text" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} disabled={!isOwner} />
            </List>

            <BlockTitle>{t('description')}</BlockTitle>
            <List strongIos inset>
              <ListInput type="text" value={description} onChange={(e) => setDescription((e.target as HTMLInputElement).value)} disabled={!isOwner} />
            </List>

            <BlockTitle>{t('upload-preview')}</BlockTitle>
            <List strongIos inset>
              <ListItem
                media={theme.previewImageUrl ? <img src={theme.previewImageUrl} alt="preview" width={44} height={44} /> : <RiImageLine size={28} />}
                title={theme.previewImageUrl ? t('change') : t('upload')}
                link={isOwner && !uploading}
                onClick={isOwner && !uploading ? onPickPreview : undefined}
              />
              {uploading ? <ListItem title={t('uploading')} after={<Preloader />} /> : null}
            </List>

            <BlockTitle>{t('svg')}</BlockTitle>
            <div className="p-4 mt-2">
              <textarea
                value={svg}
                onChange={(e) => setSvg((e.target as HTMLTextAreaElement).value)}
                placeholder="Paste or edit SVG here"
                wrap="off"
                className="w-full h-[30vh] block resize-vertical p-3 font-mono text-xs overflow-x-auto rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-700"
                disabled={!isOwner}
              />
            </div>

            <BlockTitle>{t('assets')}</BlockTitle>
            <div className="p-4 mt-2">
              <textarea
                value={assets}
                onChange={(e) => {
                  const v = (e.target as HTMLTextAreaElement).value;
                  setAssets(v);
                  if (!v) {
                    setAssetsError(null);
                    return;
                  }
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
                disabled={!isOwner}
              />
              {assetsError ? <div>{assetsError}</div> : null}
            </div>

            <Block strong inset>
              <Button large onClick={save} disabled={!isOwner || saving || !title.trim() || !!assetsError}>
                {saving ? t('saving') : t('save')}
              </Button>
            </Block>

            <Block inset>
              <Button large clear onClick={onDelete} disabled={!isOwner || deleting}>
                {deleting ? t('deleting') : t('delete')}
              </Button>
            </Block>
          </>
        ) : (
          <Block strong inset>
            {loading ? t('loading') : t('not-found')}
          </Block>
        )}
      </Page>
    </>
  );
};

export default ThemeDetailPage;
