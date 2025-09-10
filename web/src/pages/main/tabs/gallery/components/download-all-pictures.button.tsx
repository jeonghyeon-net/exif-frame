import { Button } from 'konsta/react';
import { IoDownloadOutline } from 'react-icons/io5';
import { useLoadingStore } from '../../../state/loading.store';
import { usePictureStore } from '../../../state/picture.store';
import { useSettingStore } from '../../../state/setting.store';
import { useThemeStore } from '../../../state/theme.store';
import { dumpExifMetadata, replaceExifMetadata } from 'exif-curator';
import { SvgConverter } from '../../../core/svg/converter';
import download from '../../../core/download';
import { useTranslation } from 'react-i18next';

export const DownloadAllPicturesButton = () => {
  const { t } = useTranslation();
  const { pictures } = usePictureStore();
  const { svg, assets } = useThemeStore();
  const { webpMode, maintainExifMetadata } = useSettingStore();
  const { setLoading } = useLoadingStore();

  const handleClick = async () => {
    if (!pictures || pictures.length === 0) return;
    if (!svg || svg.trim().length === 0) {
      alert(t('please-select-theme-in-library'));
      return;
    }
    setLoading(true);
    try {
      const fileExtension = webpMode ? 'webp' : 'jpeg';
      let failed = 0;
      for (const picture of pictures) {
        try {
          const dumpedExifMetadata = maintainExifMetadata ? await dumpExifMetadata(await picture.loadDataUrl()) : null;
          const convertedImage = webpMode ? await SvgConverter.toWebp(svg, picture, assets) : await SvgConverter.toJpeg(svg, picture, assets);
          const payload = dumpedExifMetadata ? await replaceExifMetadata(convertedImage, dumpedExifMetadata) : convertedImage;
          const blob = new Blob([payload as BlobPart], { type: `image/${fileExtension}` });
          const url = URL.createObjectURL(blob);
          const baseName = picture.file.name.replace(/\.[^.]+$/, '');
          await download(`exif_frame_${baseName}.${fileExtension}`, url);
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('convert failed for', picture.file.name, err);
          failed++;
          continue;
        }
      }
      if (failed > 0) {
        alert(t('N-photos-failed').replace('{N}', String(failed)));
      }
    } catch (err) {
      console.error(err);
      alert(t('photo-conversion-error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button clear onClick={handleClick} disabled={!pictures || pictures.length === 0}>
        <IoDownloadOutline size={18} />
        <div style={{ width: 4 }} />
        {t('download-all')}
      </Button>
    </>
  );
};
