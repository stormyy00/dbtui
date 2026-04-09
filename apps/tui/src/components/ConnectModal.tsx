import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';
import { Panel } from './Panel.js';

interface Props {
  value: string;
}

export function ConnectModal({ value }: Props) {
  // Cursor blinks by convention — we use a static inverse block.
  const displayValue = value.length > 0 ? value : '';

  return (
    <Panel title="CONNECT TO DATABASE" active>
      <Box flexDirection="column" gap={1}>
        <Text color={colors.muted} dimColor>
          Enter your PostgreSQL connection string:
        </Text>

        {/* Input line */}
        <Box>
          <Text color={colors.muted} dimColor>▶ </Text>
          <Text color={colors.text}>{displayValue}</Text>
          {/* Block cursor */}
          <Text inverse> </Text>
        </Box>

        <Text dimColor>
          e.g.{' '}
          <Text color={colors.muted}>postgresql://user:pass@localhost:5432/mydb</Text>
        </Text>

        <Box gap={3} marginTop={1}>
          <Text><Text color={colors.primary} bold>[enter]</Text><Text color={colors.muted}> connect</Text></Text>
          <Text><Text color={colors.primary} bold>[esc]</Text><Text color={colors.muted}> cancel</Text></Text>
        </Box>
      </Box>
    </Panel>
  );
}
