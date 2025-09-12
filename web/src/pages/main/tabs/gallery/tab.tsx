import { Navbar, Toolbar } from 'konsta/react';
import { DownloadAllPicturesButton } from './components/download-all-pictures.button';
import { UploadPicturesButton } from './components/upload-pictures.button';
import { PicturesGrid } from './components/pictures.grid';
import { usePictureStore } from '../../state/picture.store';
import { useTranslation } from 'react-i18next';
import { DropPicturesOverlay } from './components/drop-pictures.overlay';
import { DragUploadHint } from './components/drag-upload.hint';

export const GalleryTab = () => {
  const { t } = useTranslation();
  const { pictures } = usePictureStore();

  return (
    <>
      <Navbar title={t('gallery')} />

      <PicturesGrid />

      {pictures.length === 0 ? (
        <div className="flex items-center justify-center py-5">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm font-medium select-none">{t('please-upload-the-photo')}</div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-5">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm font-medium select-none">{t('N-photos-have-been-loaded').replace('{N}', pictures.length.toLocaleString())}</div>
        </div>
      )}

      <Toolbar className="bottom-12 fixed">
        <UploadPicturesButton />
        <DownloadAllPicturesButton />
      </Toolbar>

      <DropPicturesOverlay />
      {pictures.length === 0 ? <DragUploadHint /> : null}
    </>
  );
};
