import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function JibbleIntegrationPage() {
  const qc = useQueryClient();

  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ['jibble-status'],
    queryFn: () => getJSON<{ authorized: boolean; orgId: string; expiresAt: string | null; lastSync: string | null; lastStatus?: string; lastMessage?: string }>('/api/jibble/status'),
  });

  const { data: logs } = useQuery({
    queryKey: ['jibble-logs'],
    queryFn: () => getJSON<any[]>('/api/jibble/logs'),
  });

  const { data: diff, refetch: refetchDiff, isFetching: fetchingDiff } = useQuery({
    queryKey: ['jibble-diff', 24],
    queryFn: () => getJSON<any>(`/api/jibble/diff?hours=24`),
  });

  const syncMutation = useMutation({
    mutationFn: (hours: number) => getJSON('/api/jibble/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jibble-logs'] });
      qc.invalidateQueries({ queryKey: ['jibble-status'] });
      refetchDiff();
    },
  });

  const connect = () => {
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `/api/jibble/oauth/start?return_to=${returnTo}`;
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jibble Integration</h1>
        <div className="flex items-center gap-2">
          {!loadingStatus && (
            status?.authorized
              ? <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">Connected</span>
              : <button onClick={connect} className="btn btn-primary">Connect Jibble</button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Organization</div>
          <div className="font-medium">{status?.orgId ?? '-'}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Token Expires</div>
          <div className="font-medium">{status?.expiresAt ? new Date(status.expiresAt).toLocaleString() : '—'}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Last Sync</div>
          <div className="font-medium">
            {status?.lastSync ? `${new Date(status.lastSync).toLocaleString()} (${status?.lastStatus})` : '—'}
          </div>
          <div className="text-xs text-gray-500">{status?.lastMessage}</div>
        </div>
      </section>

      <section className="flex items-center gap-3">
        <button
          onClick={() => syncMutation.mutate(24)}
          className="btn btn-secondary"
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? 'Syncing…' : 'Sync last 24h'}
        </button>
        <button
          onClick={() => refetchDiff()}
          className="btn"
          disabled={fetchingDiff}
        >
          {fetchingDiff ? 'Recomputing…' : 'Recompute diffs'}
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Discrepancies (last 24h)</h2>
        {!diff ? <div className="text-sm text-gray-500">—</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded p-3">
              <div className="font-medium">Missing in Local</div>
              <ul className="mt-2 space-y-2">
                {diff.missingInLocal?.length ? diff.missingInLocal.map((r: any) => (
                  <li key={r.jibbleId} className="text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono">{r.jibbleId}</div>
                        <div>{new Date(r.clockIn).toLocaleString()} — {r.clockOut ? new Date(r.clockOut).toLocaleString() : '…'}</div>
                        <div className="text-xs text-gray-500">{r.verificationMethod ?? '—'} · {r.location ?? '—'}</div>
                      </div>
                      <span className="text-xs text-orange-600">Unmapped employee</span>
                    </div>
                  </li>
                )) : <li className="text-sm text-gray-500">None</li>}
              </ul>
            </div>
            <div className="border rounded p-3">
              <div className="font-medium">Mismatched Durations</div>
              <div className="text-sm text-gray-500">Depends on local time_entries configuration (wire in when ready).</div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Sync History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Run At</th>
                <th>Status</th>
                <th>Items</th>
                <th>Duration</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="py-2">{new Date(l.runAt).toLocaleString()}</td>
                  <td>{l.status}</td>
                  <td>{l.itemCount ?? '—'}</td>
                  <td>{l.durationMs ? `${l.durationMs} ms` : '—'}</td>
                  <td className="max-w-[480px] truncate">{l.message}</td>
                </tr>
              )) ?? <tr><td colSpan={5} className="py-2 text-gray-500">No logs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
