import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeRecord } from '../api/themes';

export interface DownloadedThemeEntry {
  original: ThemeRecord;
  local: ThemeRecord;
  downloadedAt: number;
}

interface DownloadsState {
  entries: Record<number, DownloadedThemeEntry>;
  setDownloaded: (theme: ThemeRecord) => void;
  redownload: (theme: ThemeRecord) => void;
  updateLocal: (id: number, updater: (prev: ThemeRecord) => ThemeRecord) => void;
  remove: (id: number) => void;
}

export const useDownloadsStore = create<DownloadsState>()(
  persist(
    (set) => ({
      entries: {},
      setDownloaded: (theme) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [theme.id]: { original: theme, local: theme, downloadedAt: Date.now() },
          },
        })),
      redownload: (theme) =>
        set((state) => {
          const prev = state.entries[theme.id];
          const nextLocal = prev && !isModified(prev) ? theme : prev?.local ?? theme;
          return {
            entries: {
              ...state.entries,
              [theme.id]: { original: theme, local: nextLocal, downloadedAt: Date.now() },
            },
          };
        }),
      updateLocal: (id, updater) =>
        set((state) => {
          const prev = state.entries[id];
          if (!prev) return { entries: state.entries };
          const local = updater(prev.local);
          return { entries: { ...state.entries, [id]: { ...prev, local } } };
        }),
      remove: (id) =>
        set((state) => {
          const next = { ...state.entries };
          delete next[id];
          return { entries: next };
        }),
    }),
    {
      name: 'exif-frame-downloads',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);

export function isModified(entry: DownloadedThemeEntry): boolean {
  const pick = (t: ThemeRecord) => ({ title: t.title, description: t.description ?? null, svg: t.svg ?? null, assets: t.assets ?? null });
  return JSON.stringify(pick(entry.original)) !== JSON.stringify(pick(entry.local));
}
