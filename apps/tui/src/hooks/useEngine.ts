import { useState, useEffect, useCallback } from 'react';
import type { EngineClient } from '../lib/engine.js';
import type { IndexedQuery, QueryResult } from '../lib/protocol.js';

export type EngineStatus = 'idle' | 'ready' | 'error';

export interface UseEngineReturn {
  status: EngineStatus;
  queries: IndexedQuery[];
  scanning: boolean;
  result: QueryResult | null;
  explainOutput: string | null;
  running: boolean;
  error: string | null;
  scan: (rootDir: string) => Promise<void>;
  run: (sql: string, connectionString: string) => Promise<void>;
  explain: (sql: string, connectionString: string, analyze?: boolean) => Promise<void>;
}

export function useEngine(engine: EngineClient): UseEngineReturn {
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [queries, setQueries] = useState<IndexedQuery[]>([]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [explainOutput, setExplainOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ping once on mount — engine ref is stable for the app lifetime.
  useEffect(() => {
    engine
      .ping()
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scan = useCallback(
    async (rootDir: string) => {
      setScanning(true);
      setError(null);
      try {
        const qs = await engine.scanProject(rootDir);
        setQueries(qs);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setScanning(false);
      }
    },
    [engine],
  );

  const run = useCallback(
    async (sql: string, connectionString: string) => {
      setRunning(true);
      setResult(null);
      setExplainOutput(null);
      setError(null);
      try {
        setResult(await engine.runQuery(sql, connectionString));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setRunning(false);
      }
    },
    [engine],
  );

  const explain = useCallback(
    async (sql: string, connectionString: string, analyze = false) => {
      setRunning(true);
      setResult(null);
      setExplainOutput(null);
      setError(null);
      try {
        setExplainOutput(await engine.explainQuery(sql, connectionString, analyze));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setRunning(false);
      }
    },
    [engine],
  );

  return { status, queries, scanning, result, explainOutput, running, error, scan, run, explain };
}
