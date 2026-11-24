import { useEffect, useState } from 'react';
import { CircleDot, Clock3, MapPin, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/UI/EmptyState.jsx';
import FlagButton from '../components/UI/FlagButton.jsx';
import Spinner from '../components/UI/Spinner.jsx';
import { getRequests } from '../services/requestService.js';

const statusStyle = { PENDING: 'bg-amber-100 text-amber-700', ASSIGNED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-violet-100 text-violet-700', RESOLVED: 'bg-emerald-100 text-emerald-700', CLOSED: 'bg-slate-100 text-slate-600' };
const pretty = (v) => v?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function MyRequests() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  useEffect(() => { getRequests().then(setItems).finally(() => setLoading(false)); }, []);
  const filtered = items.filter((item) => `${item.title} ${item.reference} ${item.location}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-wrap py-12">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Your city requests</p><h1 className="mt-2 font-display text-5xl text-forest-900">Follow the progress.</h1><p className="mt-3 text-slate-500">Every update, from the first report to the final fix.</p></div><Link to="/report" className="btn-primary"><Plus size={17} />New report</Link></div>
    <div className="relative mt-8"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input className="field !pl-12" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, reference, or location" /></div>
    {loading ? <div className="grid min-h-72 place-items-center"><Spinner className="text-forest-700" /></div> : <div className="mt-6 space-y-4">{filtered.length ? filtered.map((item) => <article className="card p-5 sm:p-6" key={item.id}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="flex gap-4"><span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700"><CircleDot size={20} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-ink">{item.title}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyle[item.status]}`}>{pretty(item.status)}</span></div><p className="mt-1 font-mono text-xs text-slate-400">{item.reference}</p><p className="mt-3 max-w-2xl text-sm text-slate-500">{item.description}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><MapPin size={14} />{item.location}</span><span className="flex items-center gap-1.5"><Clock3 size={14} />Updated {new Date(item.updatedAt).toLocaleDateString()}</span><FlagButton targetType="SERVICE_REQUEST" targetId={item.id} /></div></div></div><span className="rounded-lg bg-sand px-3 py-2 text-xs font-bold text-slate-600">{pretty(item.issueType)}</span></div></article>) : <EmptyState title="No reports found" message="When you report an issue, you’ll be able to follow it here." />}</div>}
  </div>;
}
