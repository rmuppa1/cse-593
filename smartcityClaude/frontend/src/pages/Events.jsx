import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createEvent, deleteEvent, flagEvent, getEvents, setEventBlocked, toggleRsvp, updateEvent } from '../services/eventService';
import { errorMessage } from '../services/api';
import EventCard from '../components/Events/EventCard';
import EventForm from '../components/Events/EventForm';
import FilterBar from '../components/Events/FilterBar';
import Modal from '../components/UI/Modal';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';

const EMPTY = { search: '', category: '', dateFrom: '', dateTo: '', location: '', free: '', sort: 'date' };

export default function Events() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ ...EMPTY, category: params.get('category') || '' });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | event
  const [toDelete, setToDelete] = useState(null);
  const [toFlag, setToFlag] = useState(null);
  const [reason, setReason] = useState('');
  const [flagError, setFlagError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => getEvents(filters).then(setEvents).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false)), [filters]);

  // Debounce so typing in search/location doesn't fire a request per keystroke.
  useEffect(() => {
    setError('');
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onRsvp = async (event) => {
    if (!user) return navigate('/login', { state: { from: '/events' } });
    setBusyId(event.id);
    try {
      await toggleRsvp(event.id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const save = async (data) => {
    if (editing === 'new') await createEvent(data);
    else await updateEvent(editing.id, data);
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    try {
      await deleteEvent(toDelete.id);
      setToDelete(null);
      load();
    } catch (e) {
      setError(errorMessage(e));
      setToDelete(null);
    }
  };

  const openFlag = (event) => {
    setReason('');
    setFlagError('');
    setToFlag(event);
  };

  const submitFlag = async (e) => {
    e.preventDefault();
    try {
      await flagEvent(toFlag.id, reason);
      setToFlag(null);
      setNotice('Thanks. An administrator will review your report.');
    } catch (err) {
      setFlagError(errorMessage(err));
    }
  };

  const toggleBlock = async (event) => {
    try {
      await setEventBlocked(event.id, !event.blocked);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Community events</h1>
        {isAdmin && <Button onClick={() => setEditing('new')}>+ New event</Button>}
      </div>

      <FilterBar filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY)} />
      <Alert>{error}</Alert>
      {notice && <div role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</div>}

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="py-12 text-center text-slate-500">No events match your filters.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} onRsvp={onRsvp} busy={busyId === e.id} canManage={isAdmin} onEdit={setEditing} onDelete={setToDelete}
              canFlag={user?.role === 'CITIZEN'} onFlag={openFlag} onToggleBlock={toggleBlock} />
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Create event' : 'Edit event'} onClose={() => setEditing(null)}>
          <EventForm initial={editing === 'new' ? null : editing} onSubmit={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {toFlag && (
        <Modal title="Flag this event" onClose={() => setToFlag(null)}>
          <form onSubmit={submitFlag} className="space-y-3">
            <p className="text-sm text-slate-600">Tell us what is wrong with “{toFlag.title}”. Your report is private and only administrators can see it.</p>
            <Alert>{flagError}</Alert>
            <textarea required minLength={5} maxLength={1000} rows={4} className="input" placeholder="Why should this event be reviewed?" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setToFlag(null)}>Cancel</Button>
              <Button type="submit">Submit report</Button>
            </div>
          </form>
        </Modal>
      )}
      {toDelete && (
        <Modal title="Delete event?" onClose={() => setToDelete(null)}>
          <p className="text-sm text-slate-600">“{toDelete.title}” and its RSVPs will be permanently removed.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
