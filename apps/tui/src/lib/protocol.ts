import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

export const IndexedQuerySchema = z.object({
  id: z.string(),
  filePath: z.string(),
  lineStart: z.number().int(),
  lineEnd: z.number().int(),
  functionName: z.string().nullable(),
  queryKind: z.enum(['TaggedTemplate', 'SqlFile', 'RawString']),
  rawSql: z.string(),
});
export type IndexedQuery = z.infer<typeof IndexedQuerySchema>;

// ── Requests (TS → Rust) ──────────────────────────────────────────────────────

export const RequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Ping'), id: z.string() }),
  z.object({ type: z.literal('ScanProject'), id: z.string(), rootDir: z.string() }),
  z.object({
    type: z.literal('RunQuery'),
    id: z.string(),
    sql: z.string(),
    connectionString: z.string(),
  }),
  z.object({
    type: z.literal('ExplainQuery'),
    id: z.string(),
    sql: z.string(),
    connectionString: z.string(),
    analyze: z.boolean(),
  }),
]);
export type Request = z.infer<typeof RequestSchema>;

// ── Responses (Rust → TS) ─────────────────────────────────────────────────────

export const ResponseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Pong'), id: z.string() }),
  z.object({
    type: z.literal('ScannedProject'),
    id: z.string(),
    queries: z.array(IndexedQuerySchema),
  }),
  z.object({
    type: z.literal('QueryResult'),
    id: z.string(),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string().nullable())),
    rowCount: z.number(),
    durationMs: z.number(),
  }),
  z.object({ type: z.literal('ExplainResult'), id: z.string(), output: z.string() }),
  z.object({ type: z.literal('Error'), id: z.string(), message: z.string() }),
]);
export type Response = z.infer<typeof ResponseSchema>;

// ── Convenience narrow types ──────────────────────────────────────────────────

export type QueryResult = Extract<Response, { type: 'QueryResult' }>;
export type ExplainResult = Extract<Response, { type: 'ExplainResult' }>;
