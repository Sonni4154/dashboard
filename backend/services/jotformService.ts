import { jotformSubmissions, employeeIdentities, syncLogs } from '../db/schema/integrations';
import { employees } from '../db/schema/employees';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const JOTFORM_API_BASE = process.env.JOTFORM_API_BASE || 'https://api.jotform.com';
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY!;
const FORM_IDS = (process.env.JOTFORM_FORM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

export class JotformService {
  constructor(private db: NodePgDatabase) {}

  private async fetchSubmissions(formId: string, since?: Date) {
    const url = new URL(`${JOTFORM_API_BASE}/form/${formId}/submissions`);
    url.searchParams.set('apiKey', JOTFORM_API_KEY);
    if (since) url.searchParams.set('filter', JSON.stringify({ created_at: { $gte: since.toISOString() } }));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Jotform fetch failed: ${res.statusText}`);
    const data = await res.json();
    return (data?.content ?? []) as any[];
  }

  private async resolveEmployeeIdByEmail(email?: string): Promise<number | null> {
    if (!email) return null;
    const [emp] = await this.db.select().from(employees).where(eq(employees.email, email)).limit(1);
    return emp?.id ?? null;
  }

  async runSyncRecent(hours = 24) {
    const start = Date.now();
    try {
      let total = 0;
      const since = new Date(Date.now() - hours * 3600_000);
      for (const formId of FORM_IDS) {
        const subs = await this.fetchSubmissions(formId, since);
        for (const s of subs) {
          const submissionId = s?.id ?? s?.submission_id;
          if (!submissionId) continue;
          const email = s?.answers?.email?.answer || s?.answers?.Email?.answer || s?.email;
          const employeeId = await this.resolveEmployeeIdByEmail(email);
          await this.db.insert(jotformSubmissions).values({
            formId, submissionId, employeeId, payload: s, receivedAt: new Date(s?.created_at || Date.now()),
          }).onConflictDoNothing();
          // Optionally map directory/jibble identities here from submission payload.
          total++;
        }
      }
      await this.db.insert(syncLogs).values({
        integration: 'jotform', status: 'success', itemCount: total, durationMs: Date.now() - start, message: `Synced ${total} submissions`
      });
      return { count: total };
    } catch (e: any) {
      await this.db.insert(syncLogs).values({
        integration: 'jotform', status: 'error', message: e?.message, details: { stack: e?.stack }
      });
      throw e;
    }
  }
}