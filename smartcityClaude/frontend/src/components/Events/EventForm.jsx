import { useState } from 'react';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { EVENT_CATEGORIES } from '../../utils/constants';
import { errorMessage } from '../../services/api';

const toLocalInput = (d) => {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

export default function EventForm({ initial, onSubmit, onCancel }) {
  const [f, setF] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || 'COMMUNITY_SERVICE',
    location: initial?.location || '',
    date: initial ? toLocalInput(initial.date) : '',
    isFree: initial?.isFree ?? true,
    price: initial?.price ?? '',
    capacity: initial?.capacity ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ ...f, date: new Date(f.date).toISOString(), price: f.isFree ? null : f.price });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Alert>{error}</Alert>
      <div><label className="label">Title</label><input required className="input" value={f.title} onChange={set('title')} /></div>
      <div><label className="label">Description</label><textarea required rows={3} className="input" value={f.description} onChange={set('description')} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Category</label>
          <select className="input" value={f.category} onChange={set('category')}>
            {Object.entries(EVENT_CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
        </div>
        <div><label className="label">Date & time</label><input required type="datetime-local" className="input" value={f.date} onChange={set('date')} /></div>
      </div>
      <div><label className="label">Location</label><input required className="input" value={f.location} onChange={set('location')} /></div>
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={f.isFree} onChange={set('isFree')} /> Free event</label>
        <div><label className="label">Price ($)</label><input type="number" min="0" step="0.01" disabled={f.isFree} className="input disabled:bg-slate-100" value={f.price} onChange={set('price')} /></div>
        <div><label className="label">Capacity</label><input type="number" min="1" className="input" value={f.capacity} onChange={set('capacity')} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Create event'}</Button>
      </div>
    </form>
  );
}
