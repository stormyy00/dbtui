// fixtures/sample-app/payments.ts — billing and revenue queries

declare function sql(strings: TemplateStringsArray, ...values: unknown[]): string;
declare const db: { query: (s: string) => Promise<unknown> };

export const getPaymentsByUser = sql`
  SELECT p.id, p.amount_cents, p.currency, p.status, p.created_at
  FROM payments p
  WHERE p.user_id = $1
  ORDER BY p.created_at DESC
  LIMIT 50
`;

export const getPendingPayments = sql`
  SELECT
    p.id,
    p.amount_cents,
    p.currency,
    u.email   AS user_email,
    p.created_at
  FROM payments p
  JOIN users u ON u.id = p.user_id
  WHERE p.status = 'pending'
    AND p.created_at < NOW() - INTERVAL '1 hour'
  ORDER BY p.created_at ASC
`;

export const getRevenueByDay = sql`
  SELECT
    DATE_TRUNC('day', created_at) AS day,
    SUM(amount_cents)             AS revenue_cents,
    COUNT(*)                      AS payment_count
  FROM payments
  WHERE status     = 'succeeded'
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY 1
  ORDER BY 1 ASC
`;

export const getTopSpenders = sql`
  SELECT
    u.id,
    u.name,
    u.email,
    SUM(p.amount_cents) AS total_cents
  FROM payments p
  JOIN users u ON u.id = p.user_id
  WHERE p.status = 'succeeded'
  GROUP BY u.id, u.name, u.email
  ORDER BY total_cents DESC
  LIMIT $1
`;

export const createPayment = sql`
  INSERT INTO payments (user_id, amount_cents, currency, status)
  VALUES ($1, $2, $3, 'pending')
  RETURNING id, amount_cents, currency, status, created_at
`;

export async function getFailedPaymentsToday() {
  return db.query(`
    SELECT id, user_id, amount_cents, failure_reason
    FROM payments
    WHERE status = 'failed'
      AND created_at >= DATE_TRUNC('day', NOW())
    ORDER BY created_at DESC
  `);
}
