import { useEffect, useState } from 'react';
import { Building2, Check, Clock3, RotateCcw, ShieldOff, UserCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers, reviewUser } from '../../services/moderationService.js';
import EmptyState from '../UI/EmptyState.jsx';
import Spinner from '../UI/Spinner.jsx';

const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const styles = { PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-rose-100 text-rose-700' };
const pretty = (value) => value?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

export default function ApprovalsPanel() {
  const [users, setUsers] = useState([]); const [filter, setFilter] = useState('ALL'); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(null);
  const load = async () => { try { setUsers(await getUsers()); } catch { toast.error('Could not load account records'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const review = async (id, status) => { setBusy(id); try { const result = await reviewUser(id, status); toast.success(result.message); await load(); } catch (error) { toast.error(error.response?.data?.message || 'Could not update this account'); } finally { setBusy(null); } };
  if (loading) return <div className="grid min-h-60 place-items-center"><Spinner className="text-forest-700" /></div>;
  const visible = filter === 'ALL' ? users : users.filter((user) => user.approvalStatus === filter);
  return <div className="mt-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold">Account approval history</h2><p className="mt-1 text-sm text-slate-500">Every application stays on record. Approval can be revoked and restored later.</p></div><div className="flex flex-wrap gap-1 rounded-xl border bg-white p-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === item ? 'bg-forest-800 text-white' : 'text-slate-500'}`}>{pretty(item)}{item !== 'ALL' && ` (${users.filter((user) => user.approvalStatus === item).length})`}</button>)}</div></div>
    {visible.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{visible.map((user) => <article key={user.id} className="card p-5"><div className="flex items-start gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${styles[user.approvalStatus]}`}><UserCheck size={20} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{user.name}</h3><p className="text-xs text-slate-500">{user.email}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${styles[user.approvalStatus]}`}>{pretty(user.approvalStatus)}</span></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="font-bold text-forest-700">Requested: {pretty(user.requestedRole)}</span>{user.requestedDepartment && <span className="flex items-center gap-1"><Building2 size={13} />{user.requestedDepartment}</span>}</div><p className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Clock3 size={14} />Applied {new Date(user.createdAt).toLocaleDateString()}{user.approvedAt ? ` · Last approved ${new Date(user.approvedAt).toLocaleDateString()}` : ''}</p><div className="mt-5 flex flex-wrap gap-2">{user.approvalStatus !== 'APPROVED' && <button disabled={busy === user.id} onClick={() => review(user.id, 'APPROVED')} className="btn-primary !px-4 !py-2"><Check size={16} />Approve</button>}{user.approvalStatus === 'APPROVED' && <button disabled={busy === user.id} onClick={() => review(user.id, 'PENDING')} className="btn-secondary !px-4 !py-2 text-amber-700"><ShieldOff size={16} />Unapprove</button>}{user.approvalStatus === 'PENDING' && <button disabled={busy === user.id} onClick={() => review(user.id, 'REJECTED')} className="btn-secondary !px-4 !py-2 text-coral-600"><X size={16} />Reject</button>}{user.approvalStatus === 'REJECTED' && <button disabled={busy === user.id} onClick={() => review(user.id, 'PENDING')} className="btn-secondary !px-4 !py-2"><RotateCcw size={16} />Return to pending</button>}</div></div></div></article>)}</div> : <div className="mt-5"><EmptyState title="No accounts in this view" message="Choose another status filter to review account history." /></div>}
  </div>;
}

