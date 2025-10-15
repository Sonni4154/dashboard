import { employees } from '../db/schema/employees';
import { employeeIdentities, syncLogs } from '../db/schema/integrations';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, sql } from 'drizzle-orm';

const DIRECTORY_API_BASE = process.env.DIRECTORY_API_BASE!;
const DIRECTORY_API_TOKEN = process.env.DIRECTORY_API_TOKEN!;

type DirectoryEmployee = { id: string; email: string; firstName?: string; lastName?: string; active?: boolean };

export class DirectoryService {
  constructor(private db: NodePgDatabase) {}

  private async fetchEmployees(updatedSince?: string) {
    const url = new URL(`${DIRECTORY_API_BASE}/employees`);
    if (updatedSince) url.searchParams.set('updated_since', updatedSince);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${DIRECTORY_API_TOKEN}` }});
    if (!res.ok) throw new Error(`Directory fetch failed: ${res.statusText}`);
    return (await res.json()) as DirectoryEmployee[];
  }

  async syncAll(updatedSince?: string) {
    const start = Date.now();
    try {
      const items = await this.fetchEmployees(updatedSince);
      let upserts = 0;
      for (const it of items) {
        // Upsert local employee by email (adjust to your schema)
        const name = [it.firstName, it.lastName].filter(Boolean).join(' ');
        const inserted = await this.db.execute(sql`
          INSERT INTO employees (email, name, active)
          VALUES (${it.email}, ${name || it.email}, ${it.active ?? true})
          ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, active = EXCLUDED.active
          RETURNING id
        `) as any;
        const employeeId = inserted?.rows?.[0]?.id;

        // Ensure identity mapping
        await this.db.insert(employeeIdentities).values({
          employeeId,
          provider: 'directory',
          externalId: it.id,
          email: it.email,
        }).onConflictDoNothing();

        upserts++;
      }
      await this.db.insert(syncLogs).values({
        integration: 'directory', status: 'success', itemCount: upserts, durationMs: Date.now() - start,
        message: `Synced ${upserts} directory users`
      });
      return { count: upserts };
    } catch (e: any) {
      await this.db.insert(syncLogs).values({
        integration: 'directory', status: 'error', message: e?.message, details: { stack: e?.stack }
      });
      throw e;
    }
  }
}