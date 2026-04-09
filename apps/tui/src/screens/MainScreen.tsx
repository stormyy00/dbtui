import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Panel } from '../components/Panel.js';
import { StatusBar } from '../components/StatusBar.js';
import { QueryList } from '../components/QueryList.js';
import { QueryViewer } from '../components/QueryViewer.js';
import { ResultsTable } from '../components/ResultsTable.js';
import { KeyBar } from '../components/KeyBar.js';
import { ConnectModal } from '../components/ConnectModal.js';
import type { UseEngineReturn } from '../hooks/useEngine.js';
import { colors } from '../theme.js';

type ActivePanel = 'list' | 'viewer' | 'results';
const PANEL_CYCLE: ActivePanel[] = ['list', 'viewer', 'results'];
const LIST_WIDTH = 32;

interface Props {
  engineState: UseEngineReturn;
  scanPath: string;
}

export function MainScreen({ engineState, scanPath }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = stdout.columns ?? 80;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>('list');

  // Connection string — seeded from env, editable via [c]
  const [connStr, setConnStr] = useState(process.env['DATABASE_URL'] ?? '');
  const [showConnect, setShowConnect] = useState(false);
  const [connInput, setConnInput] = useState('');

  const {
    status, queries, scanning, result, explainOutput, running, error,
    scan, run, explain,
  } = engineState;

  // Auto-scan once the engine handshake completes.
  useEffect(() => {
    if (status === 'ready') scan(scanPath);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep selection in-bounds if the query list changes.
  useEffect(() => {
    if (queries.length > 0) setSelectedIndex((i) => Math.min(i, queries.length - 1));
  }, [queries.length]);

  const selectedQuery = queries[selectedIndex] ?? null;

  useInput((input, key) => {
    // ── Connect modal captures all input while open ───────────────────────────
    if (showConnect) {
      if (key.return) {
        const trimmed = connInput.trim();
        if (trimmed) setConnStr(trimmed);
        setShowConnect(false);
        return;
      }
      if (key.escape) { setShowConnect(false); return; }
      if (key.backspace || key.delete) { setConnInput((v) => v.slice(0, -1)); return; }
      // Accept printable characters; ignore control combos.
      if (input && !key.ctrl && !key.meta && !key.tab && !key.upArrow && !key.downArrow) {
        setConnInput((v) => v + input);
      }
      return;
    }

    // ── Normal keyboard ───────────────────────────────────────────────────────
    if (input === 'q') { exit(); return; }

    if (key.tab) {
      setActivePanel((p) => {
        const i = PANEL_CYCLE.indexOf(p);
        return PANEL_CYCLE[(i + 1) % PANEL_CYCLE.length]!;
      });
      return;
    }

    if (key.upArrow)   setSelectedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIndex((i) => Math.min(queries.length - 1, i + 1));

    if (input === 's') { scan(scanPath); return; }

    if (input === 'c') {
      setConnInput(connStr);
      setShowConnect(true);
      return;
    }

    // Run / explain require a connection string — open modal if missing.
    if ((input === 'r' || input === 'e' || input === 'E') && selectedQuery && !running) {
      if (!connStr) { setConnInput(''); setShowConnect(true); return; }
      if (input === 'r') run(selectedQuery.rawSql, connStr);
      if (input === 'e') explain(selectedQuery.rawSql, connStr, false);
      if (input === 'E') explain(selectedQuery.rawSql, connStr, true);
    }
  });

  const divider = <Text color={colors.muted} dimColor>{'─'.repeat(cols)}</Text>;
  const displayStatus = scanning ? 'scanning' : status;

  return (
    <Box flexDirection="column">
      {/* ── Header ── */}
      <StatusBar
        scanPath={scanPath}
        queryCount={queries.length}
        status={displayStatus}
        connStr={connStr}
      />
      {divider}

      {/* ── Main panels ── */}
      <Box flexDirection="row" gap={1}>
        <Panel title="QUERIES" active={activePanel === 'list'} width={LIST_WIDTH}>
          <QueryList
            queries={queries}
            selectedIndex={selectedIndex}
            active={activePanel === 'list'}
            scanning={scanning}
          />
        </Panel>

        <Box flexDirection="column" flexGrow={1} gap={1}>
          <Panel title="SQL" active={activePanel === 'viewer'}>
            <QueryViewer query={selectedQuery} />
          </Panel>

          <Panel title="RESULTS" active={activePanel === 'results'}>
            <ResultsTable
              result={result}
              explainOutput={explainOutput}
              running={running}
              error={error}
            />
          </Panel>
        </Box>
      </Box>

      {/* ── Footer ── */}
      {divider}
      {showConnect ? (
        <ConnectModal value={connInput} />
      ) : (
        <KeyBar />
      )}
    </Box>
  );
}
