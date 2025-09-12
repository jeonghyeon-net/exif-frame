import { useTranslation } from 'react-i18next';

export const DragUploadHint = () => {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-24 left-0 right-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">{t('drag-and-drop-to-upload')}</div>
    </div>
  );
};
