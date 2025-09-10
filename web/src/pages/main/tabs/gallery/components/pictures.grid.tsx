import { dumpExifMetadata, replaceExifMetadata } from 'exif-curator';
import { usePictureStore } from '../../../state/picture.store';
import type { Picture } from '../../../core/picture';
import { useThemeStore } from '../../../state/theme.store';
import { SvgConverter } from '../../../core/svg/converter';
import download from '../../../core/download';
import { useSettingStore } from '../../../state/setting.store';
import { useLoadingStore } from '../../../state/loading.store';
import { useTranslation } from 'react-i18next';

export const PicturesGrid = () => {
  const { t } = useTranslation();
  const { pictures } = usePictureStore();
  const { svg, assets } = useThemeStore();
  const { webpMode, maintainExifMetadata } = useSettingStore();
  const { setLoading } = useLoadingStore();

  if (!pictures || pictures.length === 0) return <></>;

  const handlePictureClick = async (picture: Picture) => {
    if (!svg || svg.trim().length === 0) {
      alert(t('please-select-theme-in-library'));
      return;
    }
    setLoading(true);
    try {
      const dumpedExifMetadata = maintainExifMetadata ? await dumpExifMetadata(await picture.loadDataUrl()) : null;
      const fileExtension = webpMode ? 'webp' : 'jpeg';
      const convertedImage = webpMode ? await SvgConverter.toWebp(svg, picture, assets) : await SvgConverter.toJpeg(svg, picture, assets);
      const blob = new Blob([dumpedExifMetadata ? await replaceExifMetadata(convertedImage, dumpedExifMetadata) : (convertedImage as BlobPart)], { type: `image/${fileExtension}` });
      const url = URL.createObjectURL(blob);
      await download(`exif_frame_${picture.file.name.replace(/\.[^.]+$/, '')}.${fileExtension}`, url);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(t('photo-conversion-error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-0">
      <div className="grid gap-[2px] grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {pictures.map((p) => (
          <div key={p.id} className="aspect-square overflow-hidden bg-neutral-200 dark:bg-neutral-800 cursor-pointer" style={{ position: 'relative' }} onClick={() => handlePictureClick(p)}>
            {p.thumbUrl ? (
              <img
                src={p.thumbUrl}
                alt="picture"
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
              />
            ) : (
              <></>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
