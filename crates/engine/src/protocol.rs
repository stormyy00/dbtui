use serde::{Deserialize, Serialize};

// ── IndexedQuery ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexedQuery {
    pub id: String,
    pub file_path: String,
    pub line_start: u32,
    pub line_end: u32,
    pub function_name: Option<String>,
    pub query_kind: QueryKind,
    pub raw_sql: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryKind {
    TaggedTemplate,
    SqlFile,
    RawString,
}

// ── Requests (TS → Rust) ──────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum Request {
    Ping {
        id: String,
    },
    ScanProject {
        id: String,
        #[serde(rename = "rootDir")]
        root_dir: String,
    },
    RunQuery {
        id: String,
        sql: String,
        #[serde(rename = "connectionString")]
        connection_string: String,
    },
    ExplainQuery {
        id: String,
        sql: String,
        #[serde(rename = "connectionString")]
        connection_string: String,
        analyze: bool,
    },
}

// ── Responses (Rust → TS) ─────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum Response {
    Pong {
        id: String,
    },
    ScannedProject {
        id: String,
        queries: Vec<IndexedQuery>,
    },
    QueryResult {
        id: String,
        columns: Vec<String>,
        rows: Vec<Vec<Option<String>>>,
        #[serde(rename = "rowCount")]
        row_count: i64,
        #[serde(rename = "durationMs")]
        duration_ms: f64,
    },
    ExplainResult {
        id: String,
        output: String,
    },
    Error {
        id: String,
        message: String,
    },
}
