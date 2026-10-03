import { EVENT_CATEGORIES } from '../../utils/constants';

export default function FilterBar({ filters, onChange, onReset }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value });

  return (
    <section className="card space-y-4 p-4" aria-label="Event filters">
      <input className="input" type="search" placeholder="Search events…" value={filters.search} onChange={set('search')} />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange({ ...filters, category: '' })}
          className={`rounded-full border px-3 py-1 text-sm ${!filters.category ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
        >All</button>
        {Object.entries(EVENT_CATEGORIES).map(([key, c]) => (
          <button
            key={key}
            onClick={() => onChange({ ...filters, category: filters.category === key ? '' : key })}
            className={`rounded-full border px-3 py-1 text-sm ${filters.category === key ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
          >{c.icon} {c.label}</button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div><label className="label">From</label><input type="date" className="input" value={filters.dateFrom} onChange={set('dateFrom')} /></div>
        <div><label className="label">To</label><input type="date" className="input" value={filters.dateTo} onChange={set('dateTo')} /></div>
        <div><label className="label">Location</label><input className="input" placeholder="e.g. Park" value={filters.location} onChange={set('location')} /></div>
        <div>
          <label className="label">Price</label>
          <select className="input" value={filters.free} onChange={set('free')}>
            <option value="">Free & paid</option><option value="true">Free</option><option value="false">Paid</option>
          </select>
        </div>
        <div>
          <label className="label">Sort by</label>
          <select className="input" value={filters.sort} onChange={set('sort')}>
            <option value="date">Date</option><option value="popularity">Popularity</option>
          </select>
        </div>
      </div>
      <button onClick={onReset} className="text-sm text-brand-600 hover:underline">Clear all filters</button>
    </section>
  );
}
