import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL || 'postgresql://voiceai:voiceai_pass@localhost:5432/voiceai',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => {
      console.error('agent-db unexpected pool error:', err.message);
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await getPool().query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.warn(`agent-db low query (${duration}ms): ${text.substring(0, 80)}`);
  }
  return result;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
