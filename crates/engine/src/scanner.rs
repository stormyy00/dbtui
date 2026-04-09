use crate::protocol::{IndexedQuery, QueryKind};
use anyhow::Result;
use regex::Regex;
use std::{
    collections::hash_map::DefaultHasher,
    fs,
    hash::{Hash, Hasher},
    path::Path,
    sync::OnceLock,
};
use walkdir::WalkDir;

// Compiled once at first use — not on every scan() call.
static TAGGED_RE: OnceLock<Regex> = OnceLock::new();
static RAW_RE: OnceLock<Regex> = OnceLock::new();

fn tagged_re() -> &'static Regex {
    TAGGED_RE.get_or_init(|| Regex::new(r"(?s)sql`(.*?)`").unwrap())
}

fn raw_re() -> &'static Regex {
    RAW_RE.get_or_init(|| {
        Regex::new(
            r#"(?is)(?:pool\.query|\.query|db\.query)\s*\(\s*['"`](SELECT|INSERT|UPDATE|DELETE|WITH)[^'"`]*['"`]"#,
        )
        .unwrap()
    })
}

pub async fn scan(root_dir: &str) -> Result<Vec<IndexedQuery>> {
    let mut results = Vec::new();

    // Single WalkDir pass — branch on extension inside the loop.
    for entry in WalkDir::new(root_dir)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        // Skip node_modules at any depth
        .filter(|e| {
            !e.path()
                .components()
                .any(|c| c.as_os_str() == "node_modules")
        })
    {
        let path = entry.path();
        // Use Path::extension() — handles dotfiles and no-extension files correctly.
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        match ext {
            "ts" | "tsx" | "js" | "jsx" | "mts" | "mjs" => {
                let content = match fs::read_to_string(path) {
                    Ok(c) => c,
                    Err(_) => continue,
                };
                extract_queries(
                    tagged_re(),
                    &content,
                    path,
                    QueryKind::TaggedTemplate,
                    true,
                    &mut results,
                );
                extract_queries(
                    raw_re(),
                    &content,
                    path,
                    QueryKind::RawString,
                    false,
                    &mut results,
                );
            }
            "sql" => {
                let sql = match fs::read_to_string(path) {
                    Ok(s) => s.trim().to_string(),
                    Err(_) => continue,
                };
                if sql.is_empty() {
                    continue;
                }
                let line_count = sql.lines().count() as u32;
                results.push(IndexedQuery {
                    id: stable_id(&sql),
                    file_path: path.to_string_lossy().into_owned(),
                    line_start: 1,
                    line_end: line_count,
                    function_name: None,
                    query_kind: QueryKind::SqlFile,
                    raw_sql: sql,
                });
            }
            _ => {}
        }
    }

    Ok(results)
}

/// Unified extractor for both tagged templates and raw strings.
///
/// `use_capture_group = true`  → sql text comes from capture group 1  (tagged templates: sql`...`)
/// `use_capture_group = false` → sql text is the full match            (raw strings: pool.query('...'))
fn extract_queries(
    re: &Regex,
    content: &str,
    path: &Path,
    kind: QueryKind,
    use_capture_group: bool,
    out: &mut Vec<IndexedQuery>,
) {
    let file_path = path.to_string_lossy().into_owned();

    for cap in re.captures_iter(content) {
        let sql = if use_capture_group {
            cap[1].trim().to_string()
        } else {
            cap[0].trim().to_string()
        };
        if sql.is_empty() {
            continue;
        }
        let byte_offset = cap.get(0).unwrap().start();
        let line_start = content[..byte_offset].lines().count() as u32;
        let line_end = line_start + sql.lines().count() as u32;
        out.push(IndexedQuery {
            id: stable_id(&sql),
            file_path: file_path.clone(),
            line_start,
            line_end,
            function_name: None,
            query_kind: kind.clone(),
            raw_sql: sql,
        });
    }
}

/// Non-cryptographic content hash for stable query IDs within a session.
/// DefaultHasher is intentionally not stable across Rust versions —
/// these IDs are ephemeral (never persisted), so that's fine.
fn stable_id(s: &str) -> String {
    let mut h = DefaultHasher::new();
    s.hash(&mut h);
    format!("{:016x}", h.finish())
}
