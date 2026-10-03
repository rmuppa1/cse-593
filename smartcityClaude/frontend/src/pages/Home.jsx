import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../services/eventService';
import { EVENT_CATEGORIES, REQUEST_TYPES, fmtDate } from '../utils/constants';

export default function Home() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    getEvents({ dateFrom: new Date().toISOString().slice(0, 10) }).then((e) => setUpcoming(e.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-white sm:px-12">
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
          {user ? `Welcome, ${user.name.split(' ')[0]}.` : 'Your city, within reach.'}
        </h1>
        <p className="mt-3 max-w-xl text-brand-100">
          Discover local events, report problems like potholes and broken streetlights, and track how the city responds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/events" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Browse events</Link>
          {user?.role !== 'MANAGER' && (
            <Link to="/report" className="rounded-lg border border-white/60 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">Report an issue</Link>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Explore by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(EVENT_CATEGORIES).map(([key, c]) => (
            <Link key={key} to={`/events?category=${key}`} className="card p-4 text-center transition hover:border-brand-500 hover:shadow">
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-2 text-sm font-medium">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Coming up</h2>
          <Link to="/events" className="text-sm text-brand-600 hover:underline">See all</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming events yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {upcoming.map((e) => (
              <Link key={e.id} to="/events" className="card p-4 hover:shadow">
                <div className="text-xs text-slate-500">{fmtDate(e.date)}</div>
                <div className="mt-1 font-semibold">{EVENT_CATEGORIES[e.category].icon} {e.title}</div>
                <div className="mt-1 text-sm text-slate-600">📍 {e.location}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Something broken? Tell us.</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(REQUEST_TYPES).filter(([k]) => k !== 'OTHER').map(([key, t]) => (
            <Link key={key} to={`/report?type=${key}`} className="card p-4 text-center hover:border-brand-500">
              <div className="text-2xl">{t.icon}</div>
              <div className="mt-1 text-sm">{t.label}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
