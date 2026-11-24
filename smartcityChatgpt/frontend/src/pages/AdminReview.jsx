import { useState } from 'react';
import { Flag, UserCheck } from 'lucide-react';
import ApprovalsPanel from '../components/Admin/ApprovalsPanel.jsx';
import ModerationPanel from '../components/Admin/ModerationPanel.jsx';

export default function AdminReview() {
  const [tab, setTab] = useState('approvals');
  return <div className="page-wrap py-10"><div><p className="eyebrow">Administrator access only</p><h1 className="mt-2 font-display text-5xl text-forest-900">Trust and access.</h1><p className="mt-3 text-slate-500">Review role applications and community content reports from one protected workspace.</p></div><div className="mt-8 flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5"><button onClick={() => setTab('approvals')} className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold ${tab === 'approvals' ? 'bg-forest-800 text-white' : 'text-slate-500'}`}><UserCheck size={17} />Account approvals</button><button onClick={() => setTab('moderation')} className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold ${tab === 'moderation' ? 'bg-forest-800 text-white' : 'text-slate-500'}`}><Flag size={17} />Content flags</button></div>{tab === 'approvals' ? <ApprovalsPanel /> : <ModerationPanel />}</div>;
}
