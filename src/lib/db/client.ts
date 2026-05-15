import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:doxpro.db");
  }
  return dbInstance;
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  const db = await getDb();
  await db.execute(sql, params);
}

export async function select<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = await getDb();
  return db.select<T[]>(sql, params);
}
