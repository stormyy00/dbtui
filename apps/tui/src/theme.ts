// Central design token file — all color and style constants live here.
// Yellow is the primary accent for selected items, active borders, and key hints.

export const colors = {
  primary: 'yellow',   // selected items, active panel borders, key names
  accent: 'cyan',      // column headers, kind badges, special values
  success: 'green',    // engine ready
  error: 'red',        // error states
  text: 'white',       // body content
  muted: 'gray',       // separators, inactive borders, dimmed labels
} as const;

export type Color = (typeof colors)[keyof typeof colors];

export const panel = {
  activeBorder: 'yellow',
  inactiveBorder: 'gray',
  cursor: '▶',
  indent: '  ',
} as const;

// SQL keywords to highlight in the viewer
export const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
  'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ILIKE', 'BETWEEN', 'IS', 'NULL',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'FETCH', 'NEXT', 'ROWS',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'WITH', 'AS', 'DISTINCT',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'RETURNING', 'CONFLICT', 'DO', 'NOTHING', 'EXISTS', 'CROSS',
]);
