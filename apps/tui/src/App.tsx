import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QueryListScreen } from './screens/QueryListScreen.js';
import { QueryDetailScreen } from './screens/QueryDetailScreen.js';
import { useEngine } from './hooks/useEngine.js';
import { useQueryMeta } from './hooks/useQueryMeta.js';
import type { EngineClient } from './lib/engine.js';
import type { Screen, EnrichedQuery } from './types.js';

// Path to scan: first CLI arg, or current working directory.
const SCAN_PATH = process.argv[2] ?? process.cwd();

export function App({ engine }: { engine: EngineClient }) {
  const engineState = useEngine(engine);
  const queryMeta = useQueryMeta(SCAN_PATH);

  const [screen, setScreen] = useState<Screen>({ name: 'list' });
  const [connStr, setConnStr] = useState(process.env['DATABASE_URL'] ?? '');

  // Auto-scan once the engine handshake completes.
  useEffect(() => {
    if (engineState.status === 'ready') engineState.scan(SCAN_PATH);
  }, [engineState.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enrich scanned queries with metadata, then append custom queries
  const enriched: EnrichedQuery[] = useMemo(() => {
    const scanned: EnrichedQuery[] = engineState.queries.map((q) => ({
      ...q,
      source: 'scanned' as const,
      meta: queryMeta.getMeta(q.id),
    }));
    const custom: EnrichedQuery[] = queryMeta.customQueries.map((q) => ({
      source: 'custom' as const,
      id: q.id,
      rawSql: q.rawSql,
      createdAt: q.createdAt,
      meta: { title: q.title, favorite: q.favorite, lastRunAt: q.lastRunAt },
    }));
    return [...scanned, ...custom];
  }, [engineState.queries, queryMeta.getMeta, queryMeta.customQueries]);

  const navigate = useCallback((s: Screen) => setScreen(s), []);

  if (screen.name === 'detail') {
    const query = enriched.find((q) => q.id === screen.queryId);
    if (!query) {
      setScreen({ name: 'list' });
      return null;
    }
    return (
      <QueryDetailScreen
        query={query}
        engineState={engineState}
        scanPath={SCAN_PATH}
        connStr={connStr}
        setConnStr={setConnStr}
        queryMeta={queryMeta}
        navigate={navigate}
      />
    );
  }

  return (
    <QueryListScreen
      queries={enriched}
      engineState={engineState}
      scanPath={SCAN_PATH}
      connStr={connStr}
      setConnStr={setConnStr}
      queryMeta={queryMeta}
      navigate={navigate}
    />
  );
}
