import React from 'react';
import { Box, Text } from 'ink';
import path from 'node:path';
import type { IndexedQuery } from '../lib/protocol.js';
import { colors, SQL_KEYWORDS } from '../theme.js';

interface Props {
  query: IndexedQuery | null;
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

export function QueryViewer({ query }: Props) {
  if (!query) {
    return (
      <Box paddingY={1}>
        <Text dimColor>Select a query to view.</Text>
      </Box>
    );
  }

  const relPath = path.relative(process.cwd(), query.filePath) || query.filePath;

  return (
    <Box flexDirection="column" gap={1}>
      {/* SQL with keyword highlighting */}
      <Box flexDirection="column">
        {query.rawSql.split('\n').map((line, i) => (
          <SqlLine key={i} line={line} />
        ))}
      </Box>

      {/* Metadata row */}
      <Box>
        <Text>
          <Text color={colors.primary} bold>{KIND_BADGE[query.queryKind]}</Text>
          <Text color={colors.muted}>  ·  {relPath}:{query.lineStart}</Text>
        </Text>
      </Box>
    </Box>
  );
}
