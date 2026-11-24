import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Flag, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { submitFlag } from '../../services/moderationService.js';
import Spinner from './Spinner.jsx';

export default function FlagButton({ targetType, targetId, label = 'Flag' }) {
  const { user } = useAuth(); const navigate = useNavigate();
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(''); const [loading, setLoading] = useState(false);
  const show = () => user ? setOpen(true) : navigate('/login');
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const data = await submitFlag({ targetType, targetId, reason }); toast.success(data.message); setOpen(false); setReason(''); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not submit this flag'); }
    finally { setLoading(false); }
  };
  const modal = open ? createPortal(<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-forest-950/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-labelledby="flag-dialog-title"><form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="my-auto w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Send to administrators</p><h2 id="flag-dialog-title" className="mt-1 text-xl font-bold text-ink">Flag inappropriate content</h2></div><button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close flag dialog"><X size={19} /></button></div><p className="mt-4 text-sm leading-6 text-slate-500">Tell the moderation team what is inappropriate. Submitting a flag does not remove or change the content.</p><label className="label mt-5" htmlFor={`flag-reason-${targetId}`}>Reason for flagging</label><textarea id={`flag-reason-${targetId}`} autoFocus required minLength={10} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className="field min-h-32 resize-y" placeholder="Explain what the administrator should review…" /><p className="mt-1 text-right text-xs text-slate-400">{reason.length}/1000</p><div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button><button disabled={loading || reason.trim().length < 10} className="btn-primary">{loading ? <Spinner /> : <><Send size={16} />Submit flag</>}</button></div></form></div>, document.body) : null;
  return <><button type="button" onClick={show} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-coral-600" title="Report inappropriate content"><Flag size={14} />{label}</button>{modal}</>;
}

