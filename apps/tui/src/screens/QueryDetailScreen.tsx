import React, { useState } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Panel } from '../components/Panel.js';
import { StatusBar } from '../components/StatusBar.js';
import { QueryViewer } from '../components/QueryViewer.js';
import { ResultsTable } from '../components/ResultsTable.js';
import { KeyBar } from '../components/KeyBar.js';
import { ConnectModal } from '../components/ConnectModal.js';
import { useInlineEdit } from '../hooks/useInlineEdit.js';
import type { UseEngineReturn } from '../hooks/useEngine.js';
import type { UseQueryMetaReturn } from '../hooks/useQueryMeta.js';
import type { EnrichedQuery, Screen } from '../types.js';
import { colors } from '../theme.js';

type ActivePanel = 'viewer' | 'results';
const PANEL_CYCLE: ActivePanel[] = ['viewer', 'results'];

const DETAIL_HINTS = [
  { key: 'esc',  label: 'back'    },
  { key: 'tab',  label: 'panel'   },
  { key: 'z',    label: 'zoom'    },
  { key: 'r',    label: 'run'     },
  { key: 'e',    label: 'explain' },
  { key: 't',    label: 'title'   },
  { key: 'c',    label: 'connect' },
  { key: 'q',    label: 'quit'    },
];

const CUSTOM_DETAIL_HINTS = [
  { key: 'esc',  label: 'back'    },
  { key: 'tab',  label: 'panel'   },
  { key: 'z',    label: 'zoom'    },
  { key: 'i',    label: 'edit sql'},
  { key: 'r',    label: 'run'     },
  { key: 'e',    label: 'explain' },
  { key: 't',    label: 'title'   },
  { key: 'c',    label: 'connect' },
  { key: 'q',    label: 'quit'    },
];

interface Props {
  query: EnrichedQuery;
  engineState: UseEngineReturn;
  scanPath: string;
  connStr: string;
  setConnStr: (s: string) => void;
  queryMeta: UseQueryMetaReturn;
  navigate: (screen: Screen) => void;
}

export function QueryDetailScreen({
  query, engineState, scanPath, connStr, setConnStr, queryMeta, navigate,
}: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = stdout.columns ?? 80;

  const [activePanel, setActivePanel] = useState<ActivePanel>('viewer');
  const [zoomed, setZoomed] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [connInput, setConnInput] = useState('');

  const titleEdit = useInlineEdit();
  const sqlEdit = useInlineEdit();

  const isCustom = query.source === 'custom';

  const { result, explainOutput, running, error, run, explain } = engineState;

  const titleDisplay = query.meta.title ?? null;

  useInput((input, key) => {
    // Connect modal captures input
    if (showConnect) {
      if (key.return) {
        const trimmed = connInput.trim();
        if (trimmed) setConnStr(trimmed);
        setShowConnect(false);
        return;
      }
      if (key.escape) { setShowConnect(false); return; }
      if (key.backspace || key.delete) { setConnInput((v) => v.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta && !key.tab && !key.upArrow && !key.downArrow) {
        setConnInput((v) => v + input);
      }
      return;
    }

    // Title editing captures input
    if (titleEdit.editing) {
      const committed = titleEdit.handleInput(input, key);
      if (committed !== null) {
        queryMeta.setTitle(query.id, committed);
      }
      return;
    }

    // SQL editing captures input (custom queries only)
    if (sqlEdit.editing) {
      const committed = sqlEdit.handleInput(input, key);
      if (committed !== null) {
        queryMeta.updateCustomSql(query.id, committed);
      }
      return;
    }

    // Normal keyboard
    if (input === 'q') { exit(); return; }

    if (key.escape) {
      if (zoomed) { setZoomed(false); return; }
      navigate({ name: 'list' });
      return;
    }

    if (input === 'z') { setZoomed((z) => !z); return; }

    if (key.tab) {
      setActivePanel((p) => {
        const i = PANEL_CYCLE.indexOf(p);
        return PANEL_CYCLE[(i + 1) % PANEL_CYCLE.length]!;
      });
      return;
    }

    if (input === 't') {
      titleEdit.startEdit(query.meta.title ?? '');
      return;
    }

    // Edit SQL for custom queries
    if (input === 'i' && isCustom) {
      sqlEdit.startEdit(query.rawSql);
      return;
    }

    if (input === 'c') {
      setConnInput(connStr);
      setShowConnect(true);
      return;
    }

    // Run / explain
    if ((input === 'r' || input === 'e' || input === 'E') && !running) {
      if (!connStr) { setConnInput(''); setShowConnect(true); return; }
      if (!query.rawSql.trim()) return;
      if (input === 'r') {
        run(query.rawSql, connStr);
        queryMeta.recordRun(query.id);
      }
      if (input === 'e') explain(query.rawSql, connStr, false);
      if (input === 'E') explain(query.rawSql, connStr, true);
    }
  });

  const divider = <Text color={colors.muted} dimColor>{'─'.repeat(cols)}</Text>;
  const displayStatus = engineState.scanning ? 'scanning' : engineState.status;

  const sqlTitle = titleDisplay ? `SQL — ${titleDisplay}` : 'SQL';

  return (
    <Box flexDirection="column">
      {/* Header */}
      <StatusBar
        scanPath={scanPath}
        queryCount={0}
        status={displayStatus}
        connStr={connStr}
      />
      {divider}

      {/* Inline editing rows */}
      {titleEdit.editing && (
        <Box paddingX={1} paddingY={1}>
          <Text color={colors.muted}>Title: </Text>
          <Text color={colors.text}>{titleEdit.draft}</Text>
          <Text inverse> </Text>
          <Text dimColor>  [enter] save  [esc] cancel</Text>
        </Box>
      )}
      {sqlEdit.editing && (
        <Box paddingX={1} paddingY={1}>
          <Text color={colors.muted}>SQL: </Text>
          <Text color={colors.text}>{sqlEdit.draft}</Text>
          <Text inverse> </Text>
          <Text dimColor>  [enter] save  [esc] cancel</Text>
        </Box>
      )}

      {/* Panels */}
      {zoomed ? (
        <Panel title={`${activePanel.toUpperCase()}  [zoom]`} active>
          {activePanel === 'viewer' && <QueryViewer query={query} title={titleDisplay} />}
          {activePanel === 'results' && (
            <ResultsTable
              result={result}
              explainOutput={explainOutput}
              running={running}
              error={error}
            />
          )}
        </Panel>
      ) : (
        <Box flexDirection="column" flexGrow={1} gap={1}>
          <Panel title={sqlTitle} active={activePanel === 'viewer'}>
            <QueryViewer query={query} title={titleDisplay} />
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
      )}

      {/* Footer */}
      {divider}
      {showConnect ? (
        <ConnectModal value={connInput} />
      ) : (
        <KeyBar hints={isCustom ? CUSTOM_DETAIL_HINTS : DETAIL_HINTS} />
      )}
    </Box>
  );
}
