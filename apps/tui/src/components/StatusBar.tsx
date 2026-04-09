import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

export type EngineStatus = 'idle' | 'ready' | 'error' | 'scanning';

interface Props {
  scanPath: string;
  queryCount: number;
  status: EngineStatus;
  connStr: string;
}

const STATUS: Record<EngineStatus, { symbol: string; color: string; label: string }> = {
  idle:     { symbol: '○', color: colors.muted,    label: 'connecting' },
  ready:    { symbol: '●', color: colors.success,  label: 'ready'      },
  error:    { symbol: '✕', color: colors.error,    label: 'error'      },
  scanning: { symbol: '◌', color: colors.primary,  label: 'scanning'   },
};

/** Shorten a filesystem path to at most ~40 chars by keeping the last two segments. */
function shortenPath(p: string): string {
  if (p.length <= 42) return p;
  const parts = p.replace(/\\/g, '/').split('/').filter(Boolean);
  const short = '…/' + parts.slice(-2).join('/');
  return short.length < p.length ? short : p;
}

/** Extract a human-readable label from a connection string. */
function dbLabel(cs: string): string {
  if (!cs) return '';
  try {
    const u = new URL(cs);
    return u.hostname + u.pathname;
  } catch {
    return 'connected';
  }
}

export function StatusBar({ scanPath, queryCount, status, connStr }: Props) {
  const { symbol, color, label } = STATUS[status];
  const db = dbLabel(connStr);

  return (
    <Box paddingX={1}>
      <Text>
        <Text bold color={colors.primary}>dbtui</Text>
        <Text color={colors.muted}>  ·  </Text>
        <Text color={colors.muted} dimColor>{shortenPath(scanPath)}</Text>
        <Text color={colors.muted}>  ·  </Text>
        <Text color={colors.primary}>{queryCount} {queryCount === 1 ? 'query' : 'queries'}</Text>
        <Text color={colors.muted}>  ·  </Text>
        <Text color={color}>{symbol} {label}</Text>
        {db.length > 0 && (
          <>
            <Text color={colors.muted}>  ·  </Text>
            <Text color={colors.accent}>⬡ {db}</Text>
          </>
        )}
      </Text>
    </Box>
  );
}
