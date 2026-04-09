import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

// All rendered inside a single <Text> so Ink treats them as one inline run —
// prevents the keys/labels from being split onto separate lines.
// [E] (explain analyze) intentionally omitted — keeps bar under 80 cols.
const HINTS = [
  { key: '↑↓',  label: 'nav'     },
  { key: 'tab', label: 'panel'   },
  { key: 'r',   label: 'run'     },
  { key: 'e',   label: 'explain' },
  { key: 'c',   label: 'connect' },
  { key: 's',   label: 'scan'    },
  { key: 'q',   label: 'quit'    },
] as const;

export function KeyBar() {
  return (
    <Box paddingX={1}>
      <Text>
        {HINTS.map(({ key, label }, i) => (
          <Text key={key}>
            {i > 0 ? <Text color={colors.muted}>  </Text> : null}
            <Text color={colors.primary} bold>[{key}]</Text>
            <Text color={colors.muted}> {label}</Text>
          </Text>
        ))}
      </Text>
    </Box>
  );
}
