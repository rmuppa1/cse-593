import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assignRequest, getRequests, getStats, updateStatus } from '../services/requestService';
import { getFlags, reviewFlag } from '../services/eventService';
import { approveUser, getPending, rejectUser } from '../services/authService';
import { errorMessage } from '../services/api';
import { DEPARTMENTS, PRIORITIES, REQUEST_TYPES, STATUSES, fmtDate } from '../utils/constants';
import Badge from '../components/UI/Badge';
import Alert from '../components/UI/Alert';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';

function Stat({ label, value, tone = '' }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${tone}`}>{value ?? '—'}</div>
    </div>
  );
}

function Bars({ title, rows, color }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="text-sm">
              <div className="mb-0.5 flex justify-between"><span>{r.label}</span><span className="font-medium">{r.value}</span></div>
              <div className="h-2 rounded bg-slate-100"><div className={`h-2 rounded ${color}`} style={{ width: `${(r.value / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pending, setPending] = useState([]);
  const [flags, setFlags] = useState([]);
  const [filter, setFilter] = useState({ status: '', type: '', assigneeId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([getStats(), getRequests(filter)]);
      setStats(s);
      setRequests(r);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  const loadPending = useCallback(() => {
    if (!isAdmin) return;
    getPending().then(setPending).catch(() => {});
    getFlags().then(setFlags).catch(() => {});
  }, [isAdmin]);
  useEffect(() => { loadPending(); }, [loadPending]);

  const act = async (fn) => {
    setError('');
    try { await fn(); await load(); loadPending(); } catch (e) { setError(errorMessage(e)); }
  };

  const typeRows = (stats?.byType || []).map((t) => ({ label: REQUEST_TYPES[t.type].label, value: t.count }));
  const statusRows = stats ? Object.entries(stats.status).map(([k, v]) => ({ label: STATUSES[k].label, value: v })) : [];
  const setF = (k) => (e) => setFilter({ ...filter, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAdmin ? 'Administration' : 'Tasks'}</h1>
        <p className="text-sm text-slate-500">
          {isAdmin ? 'Monitor engagement, approve registrations and assign service requests.' : `${user.department ? DEPARTMENTS[user.department].label : 'General'} — all requests. Assign them to people by name.`}
        </p>
      </div>
      <Alert>{error}</Alert>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total requests" value={stats.total} />
            <Stat label="Pending" value={stats.status.PENDING} tone="text-amber-600" />
            <Stat label="Resolved" value={stats.status.RESOLVED} tone="text-green-600" />
            <Stat label="Avg. resolution (hrs)" value={stats.avgResolutionHours} />
            {isAdmin && <Stat label="Events" value={stats.totalEvents} />}
            {isAdmin && <Stat label="Total RSVPs" value={stats.totalRsvps} />}
            <Stat label="In progress" value={stats.status.IN_PROGRESS} tone="text-blue-600" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Bars title="Requests by status" rows={statusRows} color="bg-brand-500" />
            <Bars title="Requests by type" rows={typeRows} color="bg-emerald-500" />
          </div>
        </>
      )}

      {isAdmin && (
        <section className="card p-4">
          <h2 className="mb-3 text-lg font-semibold">Pending registrations</h2>
          {pending.length === 0 ? <p className="text-sm text-slate-500">No registrations are waiting for approval.</p> : (
            <ul className="divide-y divide-slate-100">
              {pending.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <span className="font-medium">{u.name}</span> <span className="text-slate-500">{u.email}</span>
                    <div className="text-xs text-slate-500">
                      {u.role === 'MANAGER' ? `Manager · ${DEPARTMENTS[u.department]?.label || 'No department'}` : 'Citizen'} · {fmtDate(u.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="px-3 py-1" onClick={() => act(() => approveUser(u.id))}>Approve</Button>
                    <Button variant="secondary" className="px-3 py-1" onClick={() => act(() => rejectUser(u.id))}>Reject</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="card p-4">
          <h2 className="mb-3 text-lg font-semibold">Flagged events</h2>
          {flags.length === 0 ? <p className="text-sm text-slate-500">No events are waiting for review.</p> : (
            <ul className="divide-y divide-slate-100">
              {flags.map((f) => (
                <li key={f.id} className="space-y-2 py-3 text-sm">
                  <div>
                    <span className="font-medium">{f.event.title}</span> <span className="text-slate-500">· {f.event.location}</span>
                    <div className="text-xs text-slate-500">Reported by {f.user.name} ({f.user.email}) · {fmtDate(f.createdAt)}</div>
                  </div>
                  <p className="rounded bg-slate-50 p-2">{f.reason}</p>
                  <div className="flex gap-2">
                    <Button variant="danger" className="px-3 py-1" onClick={() => act(() => reviewFlag(f.id, 'BLOCK'))}>Block event</Button>
                    <Button variant="secondary" className="px-3 py-1" onClick={() => act(() => reviewFlag(f.id, 'DISMISS'))}>Dismiss flag</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Service requests</h2>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Status" className="input w-auto" value={filter.status} onChange={setF('status')}>
              <option value="">All statuses</option>
              {Object.entries(STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
            <select aria-label="Type" className="input w-auto" value={filter.type} onChange={setF('type')}>
              <option value="">All types</option>
              {Object.entries(REQUEST_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
            <select aria-label="Assignment" className="input w-auto" value={filter.assigneeId} onChange={setF('assigneeId')}>
              <option value="">Assigned or not</option>
              <option value="none">Unassigned</option>
              <option value="any">Assigned</option>
            </select>
          </div>
        </div>

        {loading ? <p className="py-8 text-center text-slate-500">Loading…</p>
          : requests.length === 0 ? <p className="py-8 text-center text-slate-500">No requests found.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr><th className="py-2 pr-3">Issue</th><th className="pr-3">Location</th><th className="pr-3">Priority</th><th className="pr-3">Status</th><th className="pr-3">Assigned to</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="py-3 pr-3">
                        <div className="font-medium">{REQUEST_TYPES[r.type].icon} {r.title}</div>
                        <div className="text-xs text-slate-500">#{r.id} · {r.reporter.name} · {fmtDate(r.createdAt)}</div>
                      </td>
                      <td className="pr-3">{r.location}</td>
                      <td className="pr-3"><Badge className={PRIORITIES[r.priority].color}>{PRIORITIES[r.priority].label}</Badge></td>
                      <td className="pr-3"><Badge className={STATUSES[r.status].color}>{STATUSES[r.status].label}</Badge></td>
                      <td className="pr-3">
                        {r.assigneeName || '—'}
                      </td>
                      <td><Button variant="secondary" className="px-3 py-1" onClick={() => setEditing(r)}>Update</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {isAdmin && <p className="text-sm text-slate-500">Manage events from the <Link className="text-brand-600 hover:underline" to="/events">Events page</Link>.</p>}

      {editing && <StatusModal request={editing} isAdmin={isAdmin} onClose={() => setEditing(null)}
        onSave={(status, note, priority, assigneeName) => act(async () => {
          if (assigneeName !== (editing.assigneeName || '')) await assignRequest(editing.id, { assigneeName });
          await updateStatus(editing.id, status, note);
          if (isAdmin && priority !== editing.priority) await assignRequest(editing.id, { priority });
          setEditing(null);
        })} />}
    </div>
  );
}

function StatusModal({ request, isAdmin, onClose, onSave }) {
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState(request.managerNote || '');
  const [priority, setPriority] = useState(request.priority);
  const [assignee, setAssignee] = useState(request.assigneeName || '');
  return (
    <Modal title={`Update #${request.id}: ${request.title}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">{request.description}</p>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.entries(STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>
        {isAdmin && (
          <div>
            <label className="label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Assign to (person's full name)</label>
          <input className="input" value={assignee} placeholder="Any name; empty = unassigned" onChange={(e) => setAssignee(e.target.value)} />
        </div>
        <div><label className="label">Note to citizen (optional)</label><textarea rows={3} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(status, note, priority, assignee.trim())}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
