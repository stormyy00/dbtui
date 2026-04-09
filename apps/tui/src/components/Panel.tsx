import React from 'react';
import { Box, Text } from 'ink';
import { panel } from '../theme.js';

interface Props {
  title?: string;
  active?: boolean;
  width?: number;
  children: React.ReactNode;
}

export function Panel({ title, active = false, width, children }: Props) {
  const borderColor = active ? panel.activeBorder : panel.inactiveBorder;

  return (
    <Box
      borderStyle="round"
      borderColor={borderColor}
      flexDirection="column"
      paddingX={1}
      width={width}
    >
      {title !== undefined && (
        <Box marginBottom={1}>
          <Text bold={active} color={borderColor}>
            {title}
          </Text>
        </Box>
      )}
      {children}
    </Box>
  );
}
