import { useEffect, useState } from 'react';
import EventCard from '../components/Events/EventCard.jsx';
import FilterBar from '../components/Events/FilterBar.jsx';
import EmptyState from '../components/UI/EmptyState.jsx';
import Spinner from '../components/UI/Spinner.jsx';
import { getEvents } from '../services/eventService.js';

const initial = { search: '', category: '', date: '', type: '', cost: '', sort: 'soonest' };
export default function Events() {
  const [filters, setFilters] = useState(initial); const [events, setEvents] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = setTimeout(async () => { setLoading(true); try { setEvents(await getEvents(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)))); } catch { setEvents([]); } finally { setLoading(false); } }, 250); return () => clearTimeout(timer); }, [filters]);
  return <div className="page-wrap py-12"><div className="mb-9 max-w-2xl"><p className="eyebrow">Come join us</p><h1 className="mt-2 font-display text-5xl text-forest-900">Find your next good day.</h1><p className="mt-4 text-slate-500">Discover events, classes, volunteer opportunities, and new reasons to love where you live.</p></div><FilterBar filters={filters} setFilters={setFilters} /><div className="mt-8 flex items-center justify-between"><h2 className="font-bold text-ink">{loading ? 'Finding events…' : `${events.length} event${events.length === 1 ? '' : 's'} to explore`}</h2></div>{loading ? <div className="grid min-h-72 place-items-center"><Spinner className="text-forest-700" /></div> : <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{events.length ? events.map((event) => <EventCard event={event} key={event.id} />) : <EmptyState title="No events match those filters" />}</div>}</div>;
}
