import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

export interface KeyHint {
  key: string;
  label: string;
}

const DEFAULT_HINTS: KeyHint[] = [
  { key: '↑↓',  label: 'nav'     },
  { key: 'tab', label: 'panel'   },
  { key: 'z',   label: 'zoom'    },
  { key: 'r',   label: 'run'     },
  { key: 'e',   label: 'explain' },
  { key: 'c',   label: 'connect' },
  { key: 's',   label: 'scan'    },
  { key: 'q',   label: 'quit'    },
];

interface Props {
  hints?: KeyHint[];
}

export function KeyBar({ hints = DEFAULT_HINTS }: Props) {
  return (
    <Box paddingX={1}>
      <Text>
        {hints.map(({ key, label }, i) => (
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
