// fixtures/sample-app/index.ts — core CRUD queries

declare function sql(strings: TemplateStringsArray, ...values: unknown[]): string;
declare const db: { query: (s: string) => Promise<unknown> };

// ── Users ─────────────────────────────────────────────────────────────────────

export const getUserById = sql`
  SELECT id, name, email, role, created_at
  FROM users
  WHERE id = $1
`;

export const listUsers = sql`
  SELECT id, name, email, role, active, created_at
  FROM users
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2
`;

export const createUser = sql`
  INSERT INTO users (name, email, role)
  VALUES ($1, $2, $3)
  RETURNING id, name, email, role, created_at
`;

export const updateUserEmail = sql`
  UPDATE users
  SET email = $2, updated_at = NOW()
  WHERE id = $1
  RETURNING id, email, updated_at
`;

export const deactivateUser = sql`
  UPDATE users
  SET active = false, deactivated_at = NOW()
  WHERE id = $1
    AND active = true
  RETURNING id
`;

// ── Orders ────────────────────────────────────────────────────────────────────

export const getOrdersForUser = sql`
  SELECT o.id, o.status, o.total_cents, o.created_at
  FROM orders o
  WHERE o.user_id = $1
  ORDER BY o.created_at DESC
  LIMIT 20
`;

export const getOrderWithItems = sql`
  SELECT
    o.id, o.status, o.total_cents,
    oi.id AS item_id, oi.quantity,
    p.name AS product_name, p.price_cents
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p    ON p.id = oi.product_id
  WHERE o.id = $1
  ORDER BY oi.id ASC
`;

// ── Products ──────────────────────────────────────────────────────────────────

export const getActiveProducts = sql`
  SELECT p.id, p.name, p.price_cents, p.stock
  FROM products p
  WHERE p.active = true
  ORDER BY p.name ASC
`;

// ── Stats (raw strings) ───────────────────────────────────────────────────────

export async function getDashboardCounts() {
  return db.query(`
    SELECT
      (SELECT COUNT(*) FROM users  WHERE active = true)  AS active_users,
      (SELECT COUNT(*) FROM orders WHERE status = 'open') AS open_orders,
      (SELECT COUNT(*) FROM products WHERE stock > 0)    AS in_stock_products
  `);
}

export async function getRecentActivity() {
  return db.query(
    'SELECT id, event, user_id, created_at FROM activity_log ORDER BY created_at DESC LIMIT 25',
  );
}
