import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { StatusBar } from '../components/StatusBar.js';
import { QueryTable } from '../components/QueryTable.js';
import { KeyBar } from '../components/KeyBar.js';
import { ConnectModal } from '../components/ConnectModal.js';
import { useInlineEdit } from '../hooks/useInlineEdit.js';
import type { UseEngineReturn } from '../hooks/useEngine.js';
import type { UseQueryMetaReturn } from '../hooks/useQueryMeta.js';
import type { EnrichedQuery, Screen } from '../types.js';
import { colors } from '../theme.js';

const LIST_HINTS = [
  { key: '↑↓',    label: 'nav'      },
  { key: 'enter', label: 'open'     },
  { key: 'n',     label: 'new'      },
  { key: 't',     label: 'title'    },
  { key: 'f',     label: 'favorite' },
  { key: 'c',     label: 'connect'  },
  { key: 's',     label: 'scan'     },
  { key: 'q',     label: 'quit'     },
];

interface Props {
  queries: EnrichedQuery[];
  engineState: UseEngineReturn;
  scanPath: string;
  connStr: string;
  setConnStr: (s: string) => void;
  queryMeta: UseQueryMetaReturn;
  navigate: (screen: Screen) => void;
}

export function QueryListScreen({
  queries, engineState, scanPath, connStr, setConnStr, queryMeta, navigate,
}: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = stdout.columns ?? 80;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showConnect, setShowConnect] = useState(false);
  const [connInput, setConnInput] = useState('');

  const titleEdit = useInlineEdit();

  const { scanning, scan } = engineState;

  // Sort: favorites first, then alphabetical by label
  const sorted = useMemo(() => {
    return [...queries].sort((a, b) => {
      const af = a.meta.favorite ? 0 : 1;
      const bf = b.meta.favorite ? 0 : 1;
      if (af !== bf) return af - bf;
      const aName = a.meta.title ?? a.functionName ?? a.filePath;
      const bName = b.meta.title ?? b.functionName ?? b.filePath;
      return aName.localeCompare(bName);
    });
  }, [queries]);

  const selectedQuery = sorted[selectedIndex] ?? null;

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
      if (committed !== null && selectedQuery) {
        queryMeta.setTitle(selectedQuery.id, committed);
      }
      return;
    }

    // Normal keyboard
    if (input === 'q') { exit(); return; }

    if (key.upArrow)   setSelectedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIndex((i) => Math.min(sorted.length - 1, i + 1));

    if (key.return && selectedQuery) {
      navigate({ name: 'detail', queryId: selectedQuery.id });
      return;
    }

    if (input === 't' && selectedQuery) {
      titleEdit.startEdit(selectedQuery.meta.title ?? '');
      return;
    }

    if (input === 'f' && selectedQuery) {
      queryMeta.toggleFavorite(selectedQuery.id);
      return;
    }

    if (input === 'n') {
      const newId = queryMeta.createCustomQuery();
      navigate({ name: 'detail', queryId: newId });
      return;
    }

    if (input === 's') { scan(scanPath); return; }

    if (input === 'c') {
      setConnInput(connStr);
      setShowConnect(true);
      return;
    }
  });

  const divider = <Text color={colors.muted} dimColor>{'─'.repeat(cols)}</Text>;
  const displayStatus = scanning ? 'scanning' : engineState.status;

  return (
    <Box flexDirection="column">
      <StatusBar
        scanPath={scanPath}
        queryCount={queries.length}
        status={displayStatus}
        connStr={connStr}
      />
      {divider}

      <Box flexDirection="column" paddingX={1} paddingY={1} flexGrow={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>All Queries</Text>
        </Box>
        <QueryTable
          queries={sorted}
          selectedIndex={selectedIndex}
          active
          scanning={scanning}
          editingIndex={titleEdit.editing ? selectedIndex : null}
          editDraft={titleEdit.draft}
        />
      </Box>

      {divider}
      {showConnect ? (
        <ConnectModal value={connInput} />
      ) : (
        <KeyBar hints={LIST_HINTS} />
      )}
    </Box>
  );
}
