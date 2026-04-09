import { execa } from 'execa';
import { randomUUID } from 'node:crypto';
import { createInterface, type Interface as RLInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { type Request, type Response, ResponseSchema } from './protocol.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARGO_TOML = path.resolve(__dirname, '../../../../crates/engine/Cargo.toml');
const REQUEST_TIMEOUT_MS = 30_000;

type ExecaProcess = ReturnType<typeof execa>;

type Pending = {
  resolve: (r: Response) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class EngineClient {
  private proc: ExecaProcess;
  private rl: RLInterface;
  private pending = new Map<string, Pending>();

  constructor() {
    const bin = process.env['ENGINE_BIN'];
    this.proc = bin
      ? execa(bin, [], { stdin: 'pipe', stdout: 'pipe', stderr: 'inherit' })
      : execa('cargo', ['run', '--quiet', '--manifest-path', CARGO_TOML], {
          stdin: 'pipe',
          stdout: 'pipe',
          stderr: 'inherit',
        });

    this.rl = createInterface({ input: this.proc.stdout! });
    this.rl.on('line', (line) => this.handleLine(line));

    this.proc.on('error', (err: Error) => {
      for (const [, p] of this.pending) {
        clearTimeout(p.timer);
        p.reject(err);
      }
      this.pending.clear();
    });
  }

  private handleLine(line: string): void {
    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      return; // non-JSON lines (e.g. cargo compile output) — silently skip
    }
    const result = ResponseSchema.safeParse(raw);
    if (!result.success) return;
    const res = result.data;
    const p = this.pending.get(res.id);
    if (!p) return;
    this.pending.delete(res.id);
    clearTimeout(p.timer);
    res.type === 'Error' ? p.reject(new Error(res.message)) : p.resolve(res);
  }

  private send<T extends Response>(req: Request): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(req.id);
        reject(new Error(`${req.type} timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(req.id, {
        resolve: resolve as (r: Response) => void,
        reject,
        timer,
      });

      this.proc.stdin!.write(JSON.stringify(req) + '\n');
    });
  }

  async ping(): Promise<void> {
    const res = await this.send({ type: 'Ping', id: randomUUID() });
    if (res.type !== 'Pong') throw new Error('unexpected ping response');
  }

  async scanProject(rootDir: string) {
    const res = await this.send({ type: 'ScanProject', id: randomUUID(), rootDir });
    if (res.type !== 'ScannedProject') throw new Error('unexpected response');
    return res.queries;
  }

  async runQuery(sql: string, connectionString: string) {
    const res = await this.send({ type: 'RunQuery', id: randomUUID(), sql, connectionString });
    if (res.type !== 'QueryResult') throw new Error('unexpected response');
    return res;
  }

  async explainQuery(sql: string, connectionString: string, analyze = false) {
    const res = await this.send({
      type: 'ExplainQuery',
      id: randomUUID(),
      sql,
      connectionString,
      analyze,
    });
    if (res.type !== 'ExplainResult') throw new Error('unexpected response');
    return res.output;
  }

  kill(): void {
    this.rl.close();
    for (const [, p] of this.pending) clearTimeout(p.timer);
    this.pending.clear();
    this.proc.kill();
  }
}
