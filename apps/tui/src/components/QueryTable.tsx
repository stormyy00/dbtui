import React from 'react';
import { Box, Text } from 'ink';
import path from 'node:path';
import type { EnrichedQuery } from '../types.js';
import { colors, panel } from '../theme.js';

interface Props {
  queries: EnrichedQuery[];
  selectedIndex: number;
  active: boolean;
  scanning: boolean;
  editingIndex: number | null;
  editDraft: string;
}

function rpad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + ' '.repeat(width - s.length);
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function queryLocation(q: EnrichedQuery): string {
  if (q.source === 'custom') return '--';
  const base = path.basename(q.filePath);
  return `${base}:${q.lineStart}`;
}

function queryKindLabel(q: EnrichedQuery): string {
  if (q.source === 'custom') return 'custom';
  const labels: Record<string, string> = {
    TaggedTemplate: 'tagged',
    SqlFile:        '.sql',
    RawString:      'raw',
  };
  return labels[q.queryKind] ?? '?';
}

function queryKindColor(q: EnrichedQuery): string {
  if (q.source === 'custom') return colors.primary;
  const kindColors: Record<string, string> = {
    TaggedTemplate: colors.accent,
    SqlFile:        colors.success,
    RawString:      colors.muted,
  };
  return kindColors[q.queryKind] ?? colors.muted;
}

function relativeTime(iso: string | undefined): string {
  if (!iso) return '--';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Column widths
const COL_FAV = 3;
const COL_TITLE = 22;
const COL_KIND = 8;
const COL_LOC = 20;
const COL_LAST = 10;

export function QueryTable({ queries, selectedIndex, active, scanning, editingIndex, editDraft }: Props) {
  if (scanning) {
    return (
      <Box paddingY={1}>
        <Text color={colors.primary}>◌  scanning...</Text>
      </Box>
    );
  }

  if (queries.length === 0) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text dimColor>No queries found.</Text>
        <Text dimColor>Press [s] to scan or [n] to create a new query.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={colors.accent}>
          {rpad('', COL_FAV)}
          {rpad('TITLE', COL_TITLE)}
          {rpad('KIND', COL_KIND)}
          {rpad('LOCATION', COL_LOC)}
          {rpad('LAST RUN', COL_LAST)}
        </Text>
      </Box>

      {/* Rows */}
      {queries.map((q, i) => {
        const isSelected = i === selectedIndex;
        const isEditing = editingIndex === i;
        const fav = q.meta.favorite ? '★' : '☆';
        const title = q.meta.title ? truncate(q.meta.title, COL_TITLE - 1) : '';
        const kind = queryKindLabel(q);
        const loc = truncate(queryLocation(q), COL_LOC - 1);
        const lastRun = relativeTime(q.meta.lastRunAt);

        return (
          <Box key={q.id}>
            <Text
              bold={isSelected}
              color={isSelected ? (active ? colors.primary : colors.text) : colors.text}
              dimColor={!isSelected}
            >
              {isSelected ? panel.cursor : ' '}
              <Text color={q.meta.favorite ? colors.primary : colors.muted}>{fav}</Text>
              {' '}
              {isEditing ? (
                <Text>
                  <Text color={colors.text}>{rpad(editDraft, COL_TITLE - 1)}</Text>
                  <Text inverse> </Text>
                </Text>
              ) : (
                <Text dimColor={!title}>{rpad(title || '(untitled)', COL_TITLE)}</Text>
              )}
              <Text color={queryKindColor(q)}>{rpad(kind, COL_KIND)}</Text>
              <Text>{rpad(loc, COL_LOC)}</Text>
              <Text dimColor>{rpad(lastRun, COL_LAST)}</Text>
            </Text>
          </Box>
        );
      })}

      {/* Counter */}
      <Box marginTop={1}>
        <Text dimColor>
          {selectedIndex + 1}/{queries.length}
        </Text>
      </Box>
    </Box>
  );
}
