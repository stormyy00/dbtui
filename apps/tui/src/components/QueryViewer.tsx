import React from 'react';
import { Box, Text } from 'ink';
import path from 'node:path';
import type { EnrichedQuery } from '../types.js';
import type { IndexedQuery } from '../lib/protocol.js';
import { colors, SQL_KEYWORDS } from '../theme.js';

interface Props {
  query: EnrichedQuery | null;
  title?: string | null;
}

const KIND_BADGE: Record<IndexedQuery['queryKind'], string> = {
  TaggedTemplate: 'tagged template',
  SqlFile:        '.sql file',
  RawString:      'raw string',
};

/** Render a single SQL line with keyword tokens highlighted in cyan. */
function SqlLine({ line }: { line: string }) {
  const tokens = line.split(/(\s+)/);
  return (
    <Text>
      {tokens.map((tok, i) => {
        const isKeyword = SQL_KEYWORDS.has(tok.trim().toUpperCase());
        return (
          <Text key={i} color={isKeyword ? colors.accent : colors.text}>
            {tok}
          </Text>
        );
      })}
    </Text>
  );
}

export function QueryViewer({ query, title }: Props) {
  if (!query) {
    return (
      <Box paddingY={1}>
        <Text dimColor>Select a query to view.</Text>
      </Box>
    );
  }

  const sql = query.rawSql;

  if (!sql.trim() && query.source === 'custom') {
    return (
      <Box paddingY={1}>
        <Text dimColor>No SQL yet — press [i] to write a query.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1}>
      {/* SQL with keyword highlighting */}
      <Box flexDirection="column">
        {sql.split('\n').map((line, i) => (
          <SqlLine key={i} line={line} />
        ))}
      </Box>

      {/* Metadata row */}
      <Box>
        {query.source === 'scanned' ? (
          <Text>
            <Text color={colors.primary} bold>{KIND_BADGE[query.queryKind]}</Text>
            <Text color={colors.muted}>
              {'  ·  '}
              {path.relative(process.cwd(), query.filePath) || query.filePath}:{query.lineStart}
            </Text>
          </Text>
        ) : (
          <Text>
            <Text color={colors.primary} bold>custom query</Text>
          </Text>
        )}
      </Box>
    </Box>
  );
}
