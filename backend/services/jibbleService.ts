import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'; // adjust if you're using neon-drizzle
import { jibbleCredentials, jibbleLogs, employeeIdentities, syncLogs } from '../db/schema/integrations';
import { employees } from '../db/schema/employees';
import { encryptJson, decryptJson } from '../utils/crypto';
import cron from 'node-cron';

type AccessToken = { access_token: string; token_type: 'Bearer'; expires_in: number; refresh_token?: string; scope?: string; };
type TokenRow = typeof jibbleCredentials.$inferSelect;

type JibbleTimesheet = {
  id: string;
  userId: string;
  userEmail?: string;
  clockIn: string;     // ISO
  clockOut?: string;   // ISO
  locationName?: string;
  verificationMethod?: string; // 'face' | 'gps' | 'mobile' | 'web' | ...
  gps?: { lat?: number; lng?: number };
  checkinPhotoUrl?: string;
};

const JIBBLE_API_BASE = process.env.JIBBLE_API_BASE!;
const JIBBLE_AUTH_BASE = process.env.JIBBLE_AUTH_BASE || 'https://api.jibble.io';
const JIBBLE_CLIENT_ID = process.env.JIBBLE_CLIENT_ID!;
const JIBBLE_CLIENT_SECRET = process.env.JIBBLE_CLIENT_SECRET!;
const JIBBLE_ORG_ID = process.env.JIBBLE_ORG_ID!;
const JIBBLE_REDIRECT_URI = process.env.JIBBLE_REDIRECT_URI!;
const DISCREPANCY_WEBHOOK_URL = process.env.DISCREPANCY_WEBHOOK_URL;

export class JibbleService {
  constructor(private db: NodePgDatabase) {}

  /** Build provider authorize URL (standard OAuth2 code flow) */
  buildAuthorizeUrl(state: string) {
    // Adjust scope and authorize path to your Jibble app config.
    const scope = encodeURIComponent('timesheets.read users.read');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: JIBBLE_CLIENT_ID,
      redirect_uri: JIBBLE_REDIRECT_URI,
      scope,
      state,
      // if Jibble requires org param at auth time:
      // organization_id: JIBBLE_ORG_ID,
    });
    return `${JIBBLE_AUTH_BASE}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, authorizedBy?: number) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: JIBBLE_REDIRECT_URI,
      client_id: JIBBLE_CLIENT_ID,
      client_secret: JIBBLE_CLIENT_SECRET,
    });
    const resp = await fetch(`${JIBBLE_AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!resp.ok) throw new Error(`Token exchange failed: ${resp.statusText}`);
    const tok = (await resp.json()) as AccessToken;
    const expiresAt = new Date(Date.now() + (tok.expires_in - 60) * 1000); // refresh 60s early

    // Encrypt tokens at rest
    const accessTokenEnc = encryptJson({ token: tok.access_token });
    const refreshTokenEnc = encryptJson({ token: tok.refresh_token });

    await this.db
      .insert(jibbleCredentials)
      .values({
        orgId: JIBBLE_ORG_ID,
        accessTokenEnc: JSON.stringify(accessTokenEnc),
        refreshTokenEnc: JSON.stringify(refreshTokenEnc),
        expiresAt,
        authorizedBy,
      })
      .onConflictDoUpdate({
        target: jibbleCredentials.orgId,
        set: {
          accessTokenEnc: JSON.stringify(accessTokenEnc),
          refreshTokenEnc: JSON.stringify(refreshTokenEnc),
          expiresAt,
          authorizedBy,
          updatedAt: sql`NOW()`,
        },
      });

    return { expiresAt };
  }

  private async getCreds(): Promise<TokenRow | undefined> {
    const [row] = await this.db.select().from(jibbleCredentials).where(eq(jibbleCredentials.orgId, JIBBLE_ORG_ID)).limit(1);
    return row;
  }

  private async refreshAccessToken(refreshToken: string) {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: JIBBLE_CLIENT_ID,
      client_secret: JIBBLE_CLIENT_SECRET,
    });
    const resp = await fetch(`${JIBBLE_AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!resp.ok) throw new Error(`Refresh failed: ${resp.statusText}`);
    const tok = (await resp.json()) as AccessToken;
    const expiresAt = new Date(Date.now() + (tok.expires_in - 60) * 1000);

    const accessTokenEnc = encryptJson({ token: tok.access_token });
    const refreshTokenEnc = tok.refresh_token ? encryptJson({ token: tok.refresh_token }) : undefined;

    await this.db.update(jibbleCredentials).set({
      accessTokenEnc: JSON.stringify(accessTokenEnc),
      refreshTokenEnc: refreshTokenEnc ? JSON.stringify(refreshTokenEnc) : sql`${jibbleCredentials.refreshTokenEnc}`,
      expiresAt,
      updatedAt: sql`NOW()`,
    }).where(eq(jibbleCredentials.orgId, JIBBLE_ORG_ID));

    return { token: tok.access_token, expiresAt };
  }

  /** Guarantees a fresh access token */
  private async ensureAccessToken(): Promise<string> {
    const creds = await this.getCreds();
    if (!creds) throw new Error('Jibble not authorized yet');

    const access = decryptJson<{ token: string }>(JSON.parse(creds.accessTokenEnc));
    if (new Date() < new Date(creds.expiresAt)) return access.token;

    const refresh = decryptJson<{ token: string }>(JSON.parse(creds.refreshTokenEnc));
    const { token } = await this.refreshAccessToken(refresh.token);
    return token;
  }

  /** Fetch pages of timesheets from Jibble; adjust path/query to your Jibble API version */
  private async fetchTimesheets(fromISO: string, toISO: string) : Promise<JibbleTimesheet[]> {
    const token = await this.ensureAccessToken();
    const url = new URL(`${JIBBLE_API_BASE}/v1/organizations/${JIBBLE_ORG_ID}/timesheets`);
    url.searchParams.set('from', fromISO);
    url.searchParams.set('to', toISO);
    url.searchParams.set('pageSize', '200');

    const resp = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }});
    if (!resp.ok) throw new Error(`Timesheets fetch failed: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    // Normalize to JibbleTimesheet[]
    const rows: JibbleTimesheet[] = (data?.items ?? data) as any;
    return rows;
  }

  /** Map Jibble user to local employee by (a) existing identity mapping, (b) email fallback */
  private async resolveEmployeeId(jibbleUserId: string, userEmail?: string): Promise<number | null> {
    // identity -> provider=jibble, external_id=userId
    const [byIdentity] = await this.db.select().from(employeeIdentities)
      .where(and(eq(employeeIdentities.provider, 'jibble'), eq(employeeIdentities.externalId, jibbleUserId)))
      .limit(1);
    if (byIdentity?.employeeId) return byIdentity.employeeId;

    if (userEmail) {
      const [emp] = await this.db.select().from(employees).where(eq(employees.email, userEmail)).limit(1);
      if (emp?.id) {
        // create mapping for future lookups
        await this.db.insert(employeeIdentities).values({
          employeeId: emp.id,
          provider: 'jibble',
          externalId: jibbleUserId,
          email: userEmail,
        }).onConflictDoNothing();
        return emp.id;
      }
    }
    return null;
  }

  /** Upsert fetched timesheets into jibble_logs (and optionally into your time_entries) */
  private async upsertLogs(items: JibbleTimesheet[]) {
    let upserted = 0;
    for (const it of items) {
      const employeeId = await this.resolveEmployeeId(it.userId, it.userEmail);
      await this.db.insert(jibbleLogs).values({
        employeeId: employeeId ?? null,
        jibbleId: it.id,
        clockIn: new Date(it.clockIn),
        clockOut: it.clockOut ? new Date(it.clockOut) : null,
        location: it.locationName ?? null,
        verificationMethod: it.verificationMethod ?? null,
        gpsLat: it.gps?.lat ?? null,
        gpsLng: it.gps?.lng ?? null,
        checkinPhotoUrl: it.checkinPhotoUrl ?? null,
        syncedAt: new Date(),
      }).onConflictDoUpdate({
        target: jibbleLogs.jibbleId,
        set: {
          employeeId: employeeId ?? null,
          clockIn: new Date(it.clockIn),
          clockOut: it.clockOut ? new Date(it.clockOut) : null,
          location: it.locationName ?? null,
          verificationMethod: it.verificationMethod ?? null,
          gpsLat: it.gps?.lat ?? null,
          gpsLng: it.gps?.lng ?? null,
          checkinPhotoUrl: it.checkinPhotoUrl ?? null,
          syncedAt: new Date(),
          updatedAt: sql`NOW()`,
        },
      });
      upserted++;
      // If you want to mirror into time_entries, do it here (guarded by a feature flag/env).
    }
    return upserted;
  }

  /** Run a sync for a window */
  async runSyncWindow(from: Date, to: Date) {
    const started = Date.now();
    try {
      const items = await this.fetchTimesheets(from.toISOString(), to.toISOString());
      const count = await this.upsertLogs(items);
      const durationMs = Date.now() - started;
      await this.db.insert(syncLogs).values({
        integration: 'jibble',
        status: 'success',
        durationMs,
        itemCount: count,
        message: `Synced ${count} items`,
        details: { from, to },
      });
      return { count, durationMs };
    } catch (err: any) {
      const durationMs = Date.now() - started;
      await this.db.insert(syncLogs).values({
        integration: 'jibble',
        status: 'error',
        durationMs,
        message: err?.message || 'Unknown error',
        details: { stack: err?.stack },
      });
      throw err;
    }
  }

  /** Convenience: sync recent N hours (default 24) */
  async runSyncRecent(hours = 24) {
    const to = new Date();
    const from = new Date(to.getTime() - hours * 3600_000);
    return this.runSyncWindow(from, to);
  }

  /** Diff: find mismatches between your local time_entries and jibble_logs */
  async computeDiff(from: Date, to: Date) {
    // Replace with your actual time_entries import/schema.
    // The algorithm:
    // 1) Group by employee + day (or entry id) compare durations and overlaps
    // 2) Missing in local, missing in jibble, duration deltas > threshold
    // For brevity, below is a simple "missing in local or jibble by clockIn match" strategy.

    // jibble in window
    const jibble = await this.db.select().from(jibbleLogs)
      .where(and(gte(jibbleLogs.clockIn, from), lte(jibbleLogs.clockIn, to)));

    // Assuming you have a timeEntries table with external_id or source marks (pseudo):
    // const local = await this.db.select().from(timeEntries)
    //   .where(and(gte(timeEntries.startTime, from), lte(timeEntries.startTime, to)));

    // For demonstration without your table, we return only "missingInLocal"
    const missingInLocal = jibble.filter(j => j.employeeId == null); // not mapped employees

    return {
      from, to,
      missingInLocal,
      missingInJibble: [],   // fill when querying your local table
      mismatchedDurations: [] // fill by computing duration deltas
    };
  }

  /** Optional: push discrepancy webhook */
  async notifyDiscrepancies(payload: any) {
    if (!DISCREPANCY_WEBHOOK_URL) return;
    try {
      await fetch(DISCREPANCY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // store in webhook_outbox if you want guaranteed delivery
    }
  }

  /** Webhook handler for Jibble (optional) */
  async handleWebhook(sig: string | undefined, body: any) {
    // If Jibble sends HMAC signatures, verify using JIBBLE_WEBHOOK_SECRET here.
    // Then upsert the single event item into jibble_logs by its ID.
    const eventType = body?.type;
    if (eventType === 'timesheet.updated' || eventType === 'timesheet.created') {
      const raw = body?.data as JibbleTimesheet;
      await this.upsertLogs([raw]);
    }
  }

  /** PM2-friendly cron: run hourly */
  startCron() {
    if (process.env.CRON_ENABLED !== 'true') return;
    cron.schedule('0 * * * *', async () => {
      try {
        await this.runSyncRecent(2); // last 2 hours window is usually enough for hourly
      } catch (e) {
        // already logged
      }
    });
  }

  /** Connection/health summary */
  async connectionStatus() {
    const creds = await this.getCreds();
    const [lastRun] = await this.db.select().from(syncLogs)
      .where(eq(syncLogs.integration, 'jibble'))
      .orderBy(desc(syncLogs.runAt)).limit(1);
    return {
      authorized: !!creds,
      orgId: JIBBLE_ORG_ID,
      expiresAt: creds?.expiresAt ?? null,
      lastSync: lastRun?.runAt ?? null,
      lastStatus: lastRun?.status ?? null,
      lastMessage: lastRun?.message ?? null,
    };
  }
}