import type { IndexedQuery } from './lib/protocol.js';

export interface QueryMeta {
  title?: string;
  favorite?: boolean;
  lastRunAt?: string; // ISO timestamp
}

/** A user-created ad-hoc query stored in .dbtui.json (not from scanning). */
export interface CustomQuery {
  id: string;
  rawSql: string;
  title?: string;
  favorite?: boolean;
  lastRunAt?: string;
  createdAt: string; // ISO timestamp
}

export type EnrichedQuery =
  | (IndexedQuery & { source: 'scanned'; meta: QueryMeta })
  | { source: 'custom'; id: string; rawSql: string; meta: QueryMeta; createdAt: string };

export type Screen =
  | { name: 'list' }
  | { name: 'detail'; queryId: string };
