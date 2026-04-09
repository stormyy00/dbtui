use anyhow::Result;
use std::time::Instant;
use tokio_postgres::NoTls;

pub async fn run_query(
    connection_string: &str,
    sql: &str,
) -> Result<(Vec<String>, Vec<Vec<Option<String>>>, i64, f64)> {
    let (client, conn) = tokio_postgres::connect(connection_string, NoTls).await?;

    tokio::spawn(async move {
        if let Err(e) = conn.await {
            eprintln!("[engine] postgres connection error: {e}");
        }
    });

    let start = Instant::now();
    let rows = client.query(sql, &[]).await?;
    let duration_ms = start.elapsed().as_secs_f64() * 1000.0;

    let columns: Vec<String> = rows
        .first()
        .map(|r| r.columns().iter().map(|c| c.name().to_string()).collect())
        .unwrap_or_default();

    // Row count taken before serialization — not after — to reflect actual DB rows.
    let row_count = rows.len() as i64;

    // TODO: try_get::<_, Option<String>> only works for text/varchar columns.
    // Add a pg_value_to_string(row, i) helper covering int4/bool/timestamptz/etc.
    // before running against tables with non-text columns.
    let data: Vec<Vec<Option<String>>> = rows
        .iter()
        .map(|row| {
            (0..row.len())
                .map(|i| row.try_get::<_, Option<String>>(i).ok().flatten())
                .collect()
        })
        .collect();

    Ok((columns, data, row_count, duration_ms))
}
