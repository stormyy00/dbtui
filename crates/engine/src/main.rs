mod db;
mod protocol;
mod scanner;

use anyhow::Result;
use protocol::{Request, Response};
use std::io::{self, BufRead, Write};
use tokio::runtime::Runtime;

fn main() -> Result<()> {
    let rt = Runtime::new()?;
    let stdin = io::stdin();
    let mut out = io::BufWriter::new(io::stdout());

    for line in stdin.lock().lines() {
        let line = line?;
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let request: Request = match serde_json::from_str(line) {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[engine] parse error: {e}  (input: {line})");
                continue;
            }
        };

        let response = rt.block_on(handle(request));
        let json = serde_json::to_string(&response)?;
        writeln!(out, "{json}")?;
        out.flush()?;
    }

    Ok(())
}

async fn handle(req: Request) -> Response {
    match req {
        Request::Ping { id } => Response::Pong { id },

        Request::ScanProject { id, root_dir } => match scanner::scan(&root_dir).await {
            Ok(queries) => Response::ScannedProject { id, queries },
            Err(e) => Response::Error {
                id,
                message: e.to_string(),
            },
        },

        Request::RunQuery {
            id,
            sql,
            connection_string,
        } => match db::run_query(&connection_string, &sql).await {
            Ok((columns, rows, row_count, duration_ms)) => Response::QueryResult {
                id,
                columns,
                rows,
                row_count,
                duration_ms,
            },
            Err(e) => Response::Error {
                id,
                message: e.to_string(),
            },
        },

        Request::ExplainQuery {
            id,
            sql,
            connection_string,
            analyze,
        } => {
            let prefix = if analyze { "EXPLAIN ANALYZE" } else { "EXPLAIN" };
            let explain_sql = format!("{prefix} {sql}");
            match db::run_query(&connection_string, &explain_sql).await {
                Ok((_, rows, _, _)) => {
                    let output = rows
                        .iter()
                        .filter_map(|r| r.first()?.clone())
                        .collect::<Vec<_>>()
                        .join("\n");
                    Response::ExplainResult { id, output }
                }
                Err(e) => Response::Error {
                    id,
                    message: e.to_string(),
                },
            }
        }
    }
}
