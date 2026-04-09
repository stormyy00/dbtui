import React from 'react';
import { Box, Text } from 'ink';
import path from 'node:path';
import type { IndexedQuery } from '../lib/protocol.js';
import { colors, panel } from '../theme.js';

interface Props {
  queries: IndexedQuery[];
  selectedIndex: number;
  active: boolean;
  scanning: boolean;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function queryLabel(q: IndexedQuery): string {
  if (q.functionName) return q.functionName;
  const base = path.basename(q.filePath, path.extname(q.filePath));
  return `${base}:${q.lineStart}`;
}

const KIND_COLOR: Record<IndexedQuery['queryKind'], string> = {
  TaggedTemplate: colors.accent,
  SqlFile:        colors.success,
  RawString:      colors.muted,
};

// First word of the SQL (SELECT / INSERT / UPDATE / DELETE / WITH / CREATE…)
function sqlVerb(sql: string): string {
  return sql.trim().split(/\s+/)[0]?.toUpperCase().slice(0, 3) ?? '---';
}

export function QueryList({ queries, selectedIndex, active, scanning }: Props) {
  if (scanning) {
    return (
      <Box paddingY={1}>
        <Text color={colors.primary}>◌  scanning…</Text>
      </Box>
    );
  }

  if (queries.length === 0) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text dimColor>No queries found.</Text>
        <Text dimColor>Press [s] to scan.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Counter */}
      <Box marginBottom={1}>
        <Text dimColor>
          {selectedIndex + 1}/{queries.length}
        </Text>
      </Box>

      {/* Query rows */}
      {queries.map((q, i) => {
        const isSelected = i === selectedIndex;
        const label = truncate(queryLabel(q), 20);
        const verb = sqlVerb(q.rawSql);
        const kindColor = KIND_COLOR[q.queryKind];

        return (
          <Box key={q.id}>
            <Text
              bold={isSelected}
              color={isSelected ? (active ? colors.primary : colors.text) : colors.text}
              dimColor={!isSelected}
            >
              {isSelected ? `${panel.cursor} ` : `${panel.indent}`}
              <Text color={isSelected ? kindColor : colors.muted}>{verb} </Text>
              {label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
