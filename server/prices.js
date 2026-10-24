import pool from "./db.js";

export async function savePrices(symbol, rows) {
  for (const { date, close } of rows) {
    await pool.query(
      `INSERT INTO prices (symbol, trading_date, close)
        VALUES ($1, $2, $3)
        ON CONFLICT (symbol, trading_date) DO UPDATE SET close = EXCLUDED.close`,
      [symbol, date, close],
    );
  }

  await pool.query(
    `INSERT INTO price_cache_status (symbol, last_checked_at)
      VALUES ($1, NOW())
      ON CONFLICT (symbol) DO UPDATE SET last_checked_at = NOW()`,
    [symbol],
  );
}
