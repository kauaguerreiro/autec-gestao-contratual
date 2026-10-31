import type BetterSqlite3 from 'better-sqlite3';

/**
 * Indicadores calculados no servidor a partir das colunas indexadas.
 * (O painel de Relatórios do front-end faz análises mais detalhadas no navegador.)
 */
export class ReportService {
  constructor(private readonly db: BetterSqlite3.Database) {}

  summary(orgId: number) {
    const today = new Date().toISOString().slice(0, 10);
    const row = this.db
      .prepare(
        `SELECT
           COUNT(*)                                                           AS documents,
           SUM(CASE WHEN contract_type = 'Principal' THEN 1 ELSE 0 END)       AS contracts,
           SUM(CASE WHEN contract_type = 'Aditivo' THEN 1 ELSE 0 END)         AS amendments,
           SUM(CASE WHEN contract_type = 'Distrato' THEN 1 ELSE 0 END)        AS terminations,
           SUM(CASE WHEN end_date IS NOT NULL AND end_date < ? THEN 1 ELSE 0 END) AS past_end_date,
           SUM(CASE WHEN processing = 'pending' THEN 1 ELSE 0 END)            AS unread,
           COALESCE(SUM(value_cents), 0)                                      AS value_cents
         FROM documents WHERE org_id = ?`,
      )
      .get(today, orgId) as any;
    const upcoming = this.db
      .prepare(
        `SELECT id, name, end_date AS endDate, value_cents AS valueCents FROM documents
         WHERE org_id = ? AND end_date >= ? AND end_date <= date(?, '+90 day') ORDER BY end_date LIMIT 50`,
      )
      .all(orgId, today, today);
    return { generatedAt: new Date().toISOString(), ...row, monthlyValue: (row.value_cents ?? 0) / 100, upcoming };
  }
}
