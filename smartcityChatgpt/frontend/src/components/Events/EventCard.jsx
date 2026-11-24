import { useState } from 'react';
import { CalendarDays, Check, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { registerForEvent } from '../../services/eventService.js';
import FlagButton from '../UI/FlagButton.jsx';

const looks = {
  ENVIRONMENT: ['from-emerald-800 to-teal-500', '🌿'], SPORTS: ['from-blue-800 to-cyan-500', '⚽'],
  PUBLIC_SAFETY: ['from-orange-700 to-amber-400', '🛟'], EDUCATION: ['from-indigo-800 to-violet-500', '📚'],
  COMMUNITY_SERVICE: ['from-rose-700 to-orange-400', '🤝'], CULTURAL_ACTIVITIES: ['from-fuchsia-800 to-pink-500', '🎭'],
};
const pretty = (value) => value?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function EventCard({ event }) {
  const { user } = useAuth(); const navigate = useNavigate(); const [registered, setRegistered] = useState(false); const [busy, setBusy] = useState(false);
  const [gradient, icon] = looks[event.category] || looks.COMMUNITY_SERVICE;
  const start = new Date(event.startsAt);
  const price = event.isFree ? 'Free' : `$${Number(event.price || 0).toFixed(2)}`;
  const register = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'CITIZEN') return toast.error('Only approved citizen accounts can register for events');
    setBusy(true);
    try { const { data } = await registerForEvent(event.id); setRegistered(true); toast.success(data.message); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not register'); }
    finally { setBusy(false); }
  };
  return <article className="group overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lift">
    <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${gradient}`}><div className="dot-grid absolute inset-0 opacity-40" /><span className="absolute bottom-4 right-5 text-6xl drop-shadow-lg transition group-hover:scale-110">{icon}</span><div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-forest-900 backdrop-blur">{pretty(event.category)}</div><span className="absolute right-4 top-4 rounded-full bg-forest-950/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{price}</span>{event.featured && <span className="absolute bottom-4 left-4 rounded-full bg-coral-500 px-3 py-1 text-xs font-bold text-white">Featured · {price}</span>}</div>
    <div className="p-5"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-coral-600"><CalendarDays size={16} />{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div><h3 className="text-xl font-bold tracking-tight text-ink">{event.title}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{event.description}</p>
      <div className="mt-4 border-t border-slate-100 pt-4"><div className="flex items-end justify-between gap-3"><div className="min-w-0 text-xs text-slate-500"><span className="flex items-center gap-1.5 truncate"><MapPin size={14} />{event.location}</span><span className="mt-1.5 flex items-center gap-1.5"><Users size={14} />{event._count?.registrations || 0}{event.capacity ? ` / ${event.capacity}` : ''} going</span></div><button onClick={register} disabled={busy || registered} className="btn-primary !px-3 !py-2 text-xs">{registered ? <><Check size={15} />Registered</> : busy ? 'Joining…' : 'Register'}</button></div><div className="mt-4 flex justify-end"><FlagButton targetType="EVENT" targetId={event.id} /></div></div>
    </div>
  </article>;
}
