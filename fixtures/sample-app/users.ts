// fixtures/sample-app/users.ts — user profile and search queries

declare function sql(strings: TemplateStringsArray, ...values: unknown[]): string;
declare const db: { query: (s: string, params?: unknown[]) => Promise<unknown> };

export const getUserProfile = sql`
  SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.created_at,
    COUNT(DISTINCT o.id)          AS order_count,
    COALESCE(SUM(o.total_cents), 0) AS lifetime_value_cents
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
  WHERE u.id = $1
  GROUP BY u.id, u.name, u.email, u.role, u.created_at
`;

export const searchUsers = sql`
  SELECT id, name, email, role, active
  FROM users
  WHERE (name ILIKE $1 OR email ILIKE $1)
    AND active = true
  ORDER BY name ASC
  LIMIT 20
`;

export const getUsersByRole = sql`
  SELECT id, name, email, created_at
  FROM users
  WHERE role = $1
    AND active = true
  ORDER BY created_at DESC
`;

export const getUserSessionCount = sql`
  SELECT
    u.id,
    u.name,
    COUNT(s.id) AS active_sessions
  FROM users u
  LEFT JOIN sessions s ON s.user_id = u.id
    AND s.expires_at > NOW()
  WHERE u.id = $1
  GROUP BY u.id, u.name
`;

export async function updateUserRole(userId: number, role: string) {
  return db.query(
    'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, role',
    [role, userId],
  );
}

export async function deleteExpiredSessions() {
  return db.query(
    'DELETE FROM sessions WHERE expires_at < NOW() RETURNING id, user_id',
  );
}
