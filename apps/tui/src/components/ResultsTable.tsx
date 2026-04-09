import React from 'react';
import { Box, Text } from 'ink';
import type { QueryResult } from '../lib/protocol.js';
import { colors } from '../theme.js';

interface Props {
  result: QueryResult | null;
  explainOutput: string | null;
  running: boolean;
  error: string | null;
}

const COL_GAP = 2; // spaces between columns

function rpad(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

function ResultRows({ result }: { result: QueryResult }) {
  if (result.rowCount === 0) {
    return (
      <Text dimColor>0 rows  ({result.durationMs.toFixed(1)}ms)</Text>
    );
  }

  const cell = (v: string | null) => v ?? 'null';

  // Column widths: max of header and all cell values
  const widths = result.columns.map((col, i) =>
    Math.max(col.length, ...result.rows.map((r) => cell(r[i] ?? null).length)),
  );

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Text bold color={colors.accent}>
        {result.columns.map((col, i) => rpad(col, widths[i]! + COL_GAP)).join('')}
      </Text>

      {/* Divider */}
      <Text color={colors.muted} dimColor>
        {result.columns.map((_, i) => rpad('─'.repeat(widths[i]!), widths[i]! + COL_GAP)).join('')}
      </Text>

      {/* Data rows */}
      {result.rows.map((row, ri) => (
        <Text key={ri} color={colors.text}>
          {row.map((v, ci) => rpad(cell(v), widths[ci]! + COL_GAP)).join('')}
        </Text>
      ))}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}
          {'  ·  '}
          {result.durationMs.toFixed(1)}ms
        </Text>
      </Box>
    </Box>
  );
}

export function ResultsTable({ result, explainOutput, running, error }: Props) {
  if (running) {
    return <Text color={colors.primary}>◌  running…</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color={colors.error} bold>✕  error</Text>
        <Text color={colors.error} dimColor>{error}</Text>
      </Box>
    );
  }

  if (explainOutput) {
    return (
      <Box flexDirection="column">
        {explainOutput.split('\n').map((line, i) => (
          <Text key={i} color={colors.text} dimColor>{line}</Text>
        ))}
      </Box>
    );
  }

  if (!result) {
    return (
      <Text dimColor>No results yet  —  press [r] to run, [e] to explain.</Text>
    );
  }

  return <ResultRows result={result} />;
}
