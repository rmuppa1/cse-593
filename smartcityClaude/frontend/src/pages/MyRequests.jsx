import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRequests } from '../services/requestService';
import { errorMessage } from '../services/api';
import { REQUEST_TYPES, STATUSES, fmtDate } from '../utils/constants';
import Badge from '../components/UI/Badge';
import Alert from '../components/UI/Alert';

export default function MyRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRequests().then(setItems).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My reports</h1>
        <Link to="/report" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">+ New report</Link>
      </div>
      <Alert>{error}</Alert>
      {loading ? <p className="py-12 text-center text-slate-500">Loading…</p>
        : items.length === 0 ? <p className="py-12 text-center text-slate-500">You haven't reported anything yet.</p>
        : (
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{REQUEST_TYPES[r.type].icon} {r.title} <span className="text-xs font-normal text-slate-400">#{r.id}</span></div>
                  <Badge className={STATUSES[r.status].color}>{STATUSES[r.status].label}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-slate-500">
                  <span>📍 {r.location}</span>
                  <span>Submitted {fmtDate(r.createdAt)}</span>
                  {r.assigneeName && <span>Handled by {r.assigneeName}</span>}
                </div>
                {r.managerNote && <p className="mt-2 rounded bg-slate-50 p-2 text-sm"><strong>Update:</strong> {r.managerNote}</p>}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
