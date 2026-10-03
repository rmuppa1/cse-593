import Badge from '../UI/Badge';
import Button from '../UI/Button';
import { EVENT_CATEGORIES, fmtDate, fmtTime } from '../../utils/constants';

export default function EventCard({ event, onRsvp, busy, canManage, onEdit, onDelete, canFlag, onFlag, onToggleBlock }) {
  const cat = EVENT_CATEGORIES[event.category];
  const full = event.capacity && event.rsvpCount >= event.capacity && !event.attending;
  const past = new Date(event.date) < new Date();

  return (
    <article className="card flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={cat.color}>{cat.icon} {cat.label}</Badge>
          {event.blocked && <Badge className="bg-red-100 text-red-800">Blocked</Badge>}
        </div>
        <Badge className={event.isFree ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}>
          {event.isFree ? 'Free' : `$${Number(event.price || 0).toFixed(2)}`}
        </Badge>
      </div>
      <h3 className="text-lg font-semibold">{event.title}</h3>
      <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-600">{event.description}</p>
      <dl className="mt-4 space-y-1 text-sm text-slate-600">
        <div>📅 {fmtDate(event.date)} · {fmtTime(event.date)}</div>
        <div>📍 {event.location}</div>
        <div>👥 {event.rsvpCount} attending{event.capacity ? ` / ${event.capacity}` : ''}</div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant={event.attending ? 'secondary' : 'primary'}
          disabled={busy || past || full}
          onClick={() => onRsvp(event)}
          className="flex-1"
        >
          {past ? 'Event ended' : event.attending ? '✓ Attending (cancel)' : full ? 'Full' : 'Attend'}
        </Button>
        {canManage && (
          <>
            <Button variant="secondary" onClick={() => onToggleBlock(event)}>{event.blocked ? 'Unblock' : 'Block'}</Button>
            <Button variant="secondary" onClick={() => onEdit(event)}>Edit</Button>
            <Button variant="danger" onClick={() => onDelete(event)}>Delete</Button>
          </>
        )}
      </div>
      {canFlag && (
        <button onClick={() => onFlag(event)} className="mt-3 self-start text-xs text-slate-500 hover:text-red-600 hover:underline">⚑ Flag this event</button>
      )}
    </article>
  );
}
