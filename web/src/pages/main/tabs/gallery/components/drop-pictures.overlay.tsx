import { useCallback, useEffect, useRef, useState } from 'react';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { usePictureStore } from '../../../state/picture.store';
import { Picture } from '../../../core/picture';

export const DropPicturesOverlay = () => {
  const { setPictures } = usePictureStore();

  const [dragActive, setDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const accepted = Array.from(files).filter((f) => f && f.type === 'image/jpeg');
    if (!accepted.length) return;

    const newPictures = accepted.map((file) => new Picture(file));

    const { pictures: current } = usePictureStore.getState();
    setPictures([...(current ?? []), ...newPictures]);

    let processed = 0;
    for (const p of newPictures) {
      await p.generateThumbnail(512);
      processed += 1;
      if (processed % 4 === 0) {
        const { pictures: latest } = usePictureStore.getState();
        setPictures([...latest]);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    const { pictures: latest } = usePictureStore.getState();
    setPictures([...latest]);
  }, [setPictures]);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onDragEnter = (e: DragEvent) => {
      if (hasFiles(e)) {
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current += 1;
        setDragActive(true);
      }
    };
    const onDragLeave = (e: DragEvent) => {
      if (hasFiles(e)) {
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setDragActive(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      if (hasFiles(e)) {
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current = 0;
        setDragActive(false);
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          void addFiles(e.dataTransfer.files);
          e.dataTransfer.clearData();
        }
      }
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [addFiles]);

  if (!dragActive) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-blue-900/80 dark:bg-blue-950/60" />
      <div className="absolute inset-0 flex items-center justify-center">
        <IoCloudUploadOutline size={56} className="text-white/90" />
      </div>
    </div>
  );
};
