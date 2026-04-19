import { useState, useCallback } from 'react';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { QueryMeta, CustomQuery } from '../types.js';

const META_FILE = '.dbtui.json';

interface StoreData {
  meta: Record<string, QueryMeta>;
  custom: CustomQuery[];
}

function metaPath(scanPath: string): string {
  return path.join(scanPath, META_FILE);
}

function loadStore(scanPath: string): StoreData {
  try {
    const raw = fs.readFileSync(metaPath(scanPath), 'utf-8');
    const parsed = JSON.parse(raw);
    // Handle legacy format (flat Record<string, QueryMeta>)
    if (!parsed.meta && !parsed.custom) {
      return { meta: parsed as Record<string, QueryMeta>, custom: [] };
    }
    return {
      meta: parsed.meta ?? {},
      custom: parsed.custom ?? [],
    };
  } catch {
    return { meta: {}, custom: [] };
  }
}

function saveStore(scanPath: string, data: StoreData): void {
  fs.writeFileSync(metaPath(scanPath), JSON.stringify(data, null, 2) + '\n');
}

export interface UseQueryMetaReturn {
  getMeta: (queryId: string) => QueryMeta;
  setTitle: (queryId: string, title: string) => void;
  toggleFavorite: (queryId: string) => void;
  recordRun: (queryId: string) => void;
  customQueries: CustomQuery[];
  createCustomQuery: (sql?: string) => string; // returns the new query ID
  updateCustomSql: (queryId: string, sql: string) => void;
  deleteCustomQuery: (queryId: string) => void;
}

export function useQueryMeta(scanPath: string): UseQueryMetaReturn {
  const [store, setStore] = useState<StoreData>(() => loadStore(scanPath));

  const persist = useCallback(
    (next: StoreData) => {
      saveStore(scanPath, next);
      setStore(next);
    },
    [scanPath],
  );

  const updateMeta = useCallback(
    (queryId: string, patch: Partial<QueryMeta>) => {
      setStore((prev) => {
        // Check if it's a custom query
        const customIdx = prev.custom.findIndex((q) => q.id === queryId);
        if (customIdx >= 0) {
          const custom = [...prev.custom];
          custom[customIdx] = { ...custom[customIdx]!, ...patch };
          const next = { ...prev, custom };
          saveStore(scanPath, next);
          return next;
        }
        // Scanned query meta
        const next = { ...prev, meta: { ...prev.meta, [queryId]: { ...prev.meta[queryId], ...patch } } };
        saveStore(scanPath, next);
        return next;
      });
    },
    [scanPath],
  );

  const getMeta = useCallback(
    (queryId: string): QueryMeta => {
      const custom = store.custom.find((q) => q.id === queryId);
      if (custom) return { title: custom.title, favorite: custom.favorite, lastRunAt: custom.lastRunAt };
      return store.meta[queryId] ?? {};
    },
    [store],
  );

  const setTitle = useCallback(
    (queryId: string, title: string) => updateMeta(queryId, { title: title || undefined }),
    [updateMeta],
  );

  const toggleFavorite = useCallback(
    (queryId: string) => {
      const meta = getMeta(queryId);
      updateMeta(queryId, { favorite: !meta.favorite });
    },
    [getMeta, updateMeta],
  );

  const recordRun = useCallback(
    (queryId: string) => updateMeta(queryId, { lastRunAt: new Date().toISOString() }),
    [updateMeta],
  );

  const createCustomQuery = useCallback(
    (sql = ''): string => {
      const id = `custom-${crypto.randomUUID()}`;
      const newQuery: CustomQuery = {
        id,
        rawSql: sql,
        createdAt: new Date().toISOString(),
      };
      const next = { ...store, custom: [...store.custom, newQuery] };
      persist(next);
      return id;
    },
    [store, persist],
  );

  const updateCustomSql = useCallback(
    (queryId: string, sql: string) => {
      setStore((prev) => {
        const custom = prev.custom.map((q) => (q.id === queryId ? { ...q, rawSql: sql } : q));
        const next = { ...prev, custom };
        saveStore(scanPath, next);
        return next;
      });
    },
    [scanPath],
  );

  const deleteCustomQuery = useCallback(
    (queryId: string) => {
      setStore((prev) => {
        const custom = prev.custom.filter((q) => q.id !== queryId);
        const next = { ...prev, custom };
        saveStore(scanPath, next);
        return next;
      });
    },
    [scanPath],
  );

  return {
    getMeta, setTitle, toggleFavorite, recordRun,
    customQueries: store.custom,
    createCustomQuery, updateCustomSql, deleteCustomQuery,
  };
}
